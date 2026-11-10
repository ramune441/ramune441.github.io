import importlib.util, json, pathlib, tempfile, unittest
from unittest.mock import Mock, patch

spec = importlib.util.spec_from_file_location('youtube_api', pathlib.Path(__file__).with_name('youtube-api.py'))
api = importlib.util.module_from_spec(spec); spec.loader.exec_module(api)

class YouTubeAPITests(unittest.TestCase):
    def test_wrong_channel_is_rejected_before_upload(self):
        client = object.__new__(api.YouTube)
        client.get = Mock(return_value={'items': [{'id': 'wrong', 'snippet': {'title': 'Personal'}}]})
        with self.assertRaisesRegex(RuntimeError, 'different channel'):
            client.verify_channel('expected-brand')

    def test_brand_channel_is_accepted(self):
        client = object.__new__(api.YouTube)
        client.get = Mock(return_value={'items': [{'id': 'brand', 'snippet': {'title': 'Brand'}}]})
        self.assertEqual(client.verify_channel('brand')['id'], 'brand')

    def test_resumable_range_handles_absent_and_completed_prefix(self):
        self.assertEqual(api.next_offset(Mock(headers={})), 0)
        self.assertEqual(api.next_offset(Mock(headers={'Range': 'bytes=0-8388607'})), 8388608)
        with self.assertRaises(RuntimeError): api.next_offset(Mock(headers={'Range': 'bytes=42-99'}))

    def test_completed_session_does_not_create_duplicate_video(self):
        with tempfile.TemporaryDirectory() as folder:
            file = pathlib.Path(folder) / 'video.mp4'; file.write_bytes(b'example-media')
            client = object.__new__(api.YouTube); client.headers = Mock(return_value={})
            client.sessions = {'ja:video': {'url': 'https://www.googleapis.com/upload/example', 'sha256': api.hashlib.sha256(file.read_bytes()).hexdigest()}}
            response = Mock(status_code=200, ok=True); response.json.return_value = {'id': 'already-uploaded'}
            with patch.object(api.requests, 'put', return_value=response), patch.object(api.requests, 'post') as create:
                result = client.upload('videos', 'ja:video', file, {}, {})
            self.assertEqual(result['id'], 'already-uploaded'); create.assert_not_called()

    def test_resuming_another_file_is_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            file = pathlib.Path(folder) / 'video.mp4'; file.write_bytes(b'changed')
            client = object.__new__(api.YouTube); client.sessions = {'ja:video': {'sha256': 'old-file'}}
            with patch.object(api.requests, 'post') as create:
                with self.assertRaisesRegex(RuntimeError, 'different file'): client.upload('videos', 'ja:video', file, {}, {})
            create.assert_not_called()

    def test_web_oauth_client_cannot_use_desktop_callback(self):
        with tempfile.TemporaryDirectory() as folder:
            file = pathlib.Path(folder) / 'client.json'; file.write_text(json.dumps({'web': {'client_id': 'example'}}))
            with self.assertRaisesRegex(RuntimeError, 'Desktop'): api.client_file(str(file))

    def test_video_language_and_embedding_are_explicit(self):
        item = {'title': 'Localized title', 'description': 'Localized description', 'visibility': 'public'}
        for locale, language in [('zh', 'zh-Hans'), ('zh-Hant', 'zh-Hant'), ('pt', 'pt-BR'), ('ja', 'ja')]:
            payload = api.video_payload(locale, item)
            self.assertEqual(payload['snippet']['defaultLanguage'], language)
            self.assertTrue(payload['status']['embeddable']); self.assertFalse(payload['status']['selfDeclaredMadeForKids'])

if __name__ == '__main__': unittest.main()
