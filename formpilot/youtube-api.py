"""Upload the reviewed localized store videos using the public YouTube Data API.
OAuth credentials and resumable-session checkpoints stay outside the repository.
"""
import argparse, base64, hashlib, http.server, json, os, pathlib, secrets, time, urllib.parse, webbrowser
import requests

ROOT = pathlib.Path(__file__).resolve().parent
STATE = pathlib.Path(os.environ.get('LOCALAPPDATA', pathlib.Path.home())) / 'FormPilot' / 'youtube-api'
SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl'
API = 'https://www.googleapis.com/youtube/v3/'
UPLOAD = 'https://www.googleapis.com/upload/youtube/v3/'

def read_json(path):
    return json.loads(path.read_text('utf-8-sig'))

def save_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    temporary.replace(path)

def client_file(given=None):
    if given:
        path = pathlib.Path(given).expanduser().resolve()
    else:
        matches = []
        for candidate in (pathlib.Path.home() / 'Downloads').glob('client_secret*.json'):
            data = read_json(candidate).get('installed', {})
            if data.get('project_id') == 'formpilot-490714': matches.append(candidate)
        if len(matches) != 1: raise RuntimeError('Specify the FormPilot desktop OAuth client JSON with --client-file.')
        path = matches[0]
    data = read_json(path)
    if 'installed' not in data: raise RuntimeError('A Desktop application OAuth client is required.')
    return path, data['installed']

def authorize(given=None, no_browser=False):
    path, client = client_file(given)
    verifier = secrets.token_urlsafe(64)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b'=').decode()
    state = secrets.token_urlsafe(32)
    result = {}
    class Callback(http.server.BaseHTTPRequestHandler):
        def log_message(self, *_): pass
        def do_GET(self):
            parsed = urllib.parse.urlparse(self.path)
            query = urllib.parse.parse_qs(parsed.query)
            if parsed.path != '/callback' or not secrets.compare_digest(query.get('state', [''])[0], state):
                self.send_error(400); return
            if query.get('error'): result['error'] = query['error'][0]
            elif query.get('code'): result['code'] = query['code'][0]
            else: self.send_error(400); return
            body = 'YouTube authorization received. You may return to the chat.'.encode()
            self.send_response(200); self.send_header('Content-Type', 'text/plain; charset=utf-8'); self.send_header('Cache-Control', 'no-store'); self.end_headers(); self.wfile.write(body)
    server = http.server.HTTPServer(('127.0.0.1', 0), Callback)
    server.timeout = 1
    redirect = f'http://127.0.0.1:{server.server_port}/callback'
    url = 'https://accounts.google.com/o/oauth2/v2/auth?' + urllib.parse.urlencode({
        'client_id': client['client_id'], 'redirect_uri': redirect, 'response_type': 'code', 'scope': SCOPE,
        'access_type': 'offline', 'prompt': 'consent select_account', 'state': state,
        'code_challenge': challenge, 'code_challenge_method': 'S256',
    })
    print('Authorize the FormPilot client and select the Just One More Animal channel.', flush=True)
    print(url, flush=True)
    if not no_browser:
        opened = webbrowser.open(url)
        print('Browser launch requested; use the authorization link above if no page appears.' if opened else 'Open the authorization link above in your browser.', flush=True)
    try:
        deadline = time.monotonic() + 900
        while not result and time.monotonic() < deadline: server.handle_request()
    finally: server.server_close()
    if 'code' not in result: raise RuntimeError('OAuth authorization was not completed: ' + result.get('error', 'timeout'))
    response = requests.post('https://oauth2.googleapis.com/token', data={
        'client_id': client['client_id'], 'client_secret': client['client_secret'], 'code': result['code'],
        'code_verifier': verifier, 'redirect_uri': redirect, 'grant_type': 'authorization_code',
    }, timeout=30)
    check_response(response)
    token = response.json()
    if SCOPE not in token.get('scope', '').split(): raise RuntimeError('YouTube video/caption permission was not granted.')
    token['expires_at'] = time.time() + token.get('expires_in', 3600)
    token['client_file'] = str(path)
    save_json(STATE / 'token.json', token)
    print('OAuth authorization saved outside the repository.', flush=True)
    return YouTube().verify_channel(read_json(ROOT / 'youtube.json')['channelId'])

def check_response(response):
    if response.ok or response.status_code == 308: return
    reason = ''
    try:
        error = response.json().get('error', {})
        reason = error if isinstance(error, str) else ', '.join(e.get('reason', '') for e in error.get('errors', [])) or error.get('status', '')
    except (ValueError, AttributeError): pass
    raise RuntimeError(f'YouTube/OAuth request failed: HTTP {response.status_code}, {reason}')

class YouTube:
    def __init__(self):
        self.token = read_json(STATE / 'token.json')
        self.sessions_file = STATE / 'upload-sessions.json'
        self.sessions = read_json(self.sessions_file) if self.sessions_file.exists() else {}

    def headers(self):
        if self.token.get('expires_at', 0) < time.time() + 60:
            _, client = client_file(self.token['client_file'])
            response = requests.post('https://oauth2.googleapis.com/token', data={
                'grant_type': 'refresh_token', 'client_id': client['client_id'], 'client_secret': client['client_secret'],
                'refresh_token': self.token['refresh_token'],
            }, timeout=30)
            check_response(response); self.token.update(response.json()); self.token['expires_at'] = time.time() + self.token.get('expires_in', 3600); save_json(STATE / 'token.json', self.token)
        return {'Authorization': 'Bearer ' + self.token['access_token']}

    def get(self, resource, **params):
        response = requests.get(API + resource, params=params, headers=self.headers(), timeout=60)
        check_response(response); return response.json()

    def verify_channel(self, expected):
        items = self.get('channels', part='id,snippet', mine='true').get('items', [])
        if len(items) != 1 or items[0]['id'] != expected:
            raise RuntimeError('OAuth selected a different channel. Re-authorize and choose Just One More Animal; no upload was performed.')
        print('CHANNEL VERIFIED: ' + items[0]['snippet']['title'] + ' / ' + expected, flush=True)
        return items[0]

    def upload(self, resource, key, file, payload, params):
        digest = hashlib.sha256(file.read_bytes()).hexdigest(); size = file.stat().st_size
        previous = self.sessions.get(key)
        if previous and previous['sha256'] != digest: raise RuntimeError('An existing upload session belongs to different file contents: ' + key)
        if not previous:
            response = requests.post(UPLOAD + resource, params={'uploadType': 'resumable', **params}, json=payload,
                headers={**self.headers(), 'X-Upload-Content-Type': 'video/mp4' if resource == 'videos' else 'application/octet-stream', 'X-Upload-Content-Length': str(size)}, timeout=60)
            check_response(response)
            location = response.headers.get('Location', '')
            if urllib.parse.urlparse(location).hostname != 'www.googleapis.com': raise RuntimeError('Unexpected resumable upload host.')
            previous = {'url': location, 'sha256': digest}; self.sessions[key] = previous; save_json(self.sessions_file, self.sessions)
            offset = 0
        else:
            response = requests.put(previous['url'], data=b'', headers={**self.headers(), 'Content-Range': f'bytes */{size}', 'Content-Length': '0'}, timeout=60)
            check_response(response)
            if response.status_code in (200, 201): return response.json()
            offset = next_offset(response)
        retries = 0
        with file.open('rb') as stream:
            while offset < size:
                stream.seek(offset); chunk = stream.read(8 * 1024 * 1024)
                try:
                    response = requests.put(previous['url'], data=chunk, headers={**self.headers(), 'Content-Type': 'video/mp4' if resource == 'videos' else 'application/octet-stream', 'Content-Length': str(len(chunk)), 'Content-Range': f'bytes {offset}-{offset+len(chunk)-1}/{size}'}, timeout=120)
                    if response.status_code >= 500: raise requests.ConnectionError()
                except (requests.ConnectionError, requests.Timeout):
                    retries += 1
                    if retries > 5: raise RuntimeError('Upload interrupted; rerun to resume the saved session.')
                    time.sleep(min(2 ** retries, 16))
                    response = requests.put(previous['url'], data=b'', headers={**self.headers(), 'Content-Range': f'bytes */{size}', 'Content-Length': '0'}, timeout=60)
                check_response(response)
                if response.status_code in (200, 201): return response.json()
                offset = next_offset(response)
        raise RuntimeError('No completed upload response; session retained for recovery.')

def next_offset(response):
    value = response.headers.get('Range', '')
    if not value: return 0
    if not value.startswith('bytes=0-') or not value[8:].isdigit(): raise RuntimeError('Invalid resumable upload range.')
    return int(value[8:]) + 1

def video_payload(locale, item):
    language = {'zh': 'zh-Hans', 'pt': 'pt-BR'}.get(locale, locale)
    return {'snippet': {'title': item['title'], 'description': item['description'], 'categoryId': '28', 'defaultLanguage': language},
            'status': {'privacyStatus': item.get('visibility', 'public'), 'embeddable': True, 'selfDeclaredMadeForKids': False}}

def upload_all(selected):
    metadata_file = ROOT / 'youtube.json'; metadata = read_json(metadata_file); client = YouTube(); client.verify_channel(metadata['channelId'])
    for locale, item in metadata['items'].items():
        if selected and locale not in selected: continue
        file = ROOT / item['file']
        if hashlib.sha256(file.read_bytes()).hexdigest() != item['sha256']: raise RuntimeError('File content differs from reviewed metadata: ' + locale)
        if item.get('videoId'):
            if item.get('uploadedSha256') != item['sha256']: raise RuntimeError('Existing video ID refers to another file: ' + locale)
            video = client.get('videos', part='snippet,status', id=item['videoId']).get('items', [])
            if len(video) != 1 or video[0]['snippet']['channelId'] != metadata['channelId']: raise RuntimeError('Video ownership mismatch: ' + locale)
        else:
            video = client.upload('videos', locale + ':video', file, video_payload(locale, item), {'part': 'snippet,status', 'notifySubscribers': 'false'})
            if video['snippet']['channelId'] != metadata['channelId']: raise RuntimeError('Uploaded video channel mismatch.')
            item.update(videoId=video['id'], uploadedSha256=item['sha256'], watchUrl='https://www.youtube.com/watch?v=' + video['id'])
            save_json(metadata_file, metadata)
        if not item.get('captionId'):
            caption = client.upload('captions', locale + ':captions', ROOT / item['captions'], {'snippet': {'videoId': item['videoId'], 'language': {'zh': 'zh-Hans', 'pt': 'pt-BR'}.get(locale, locale), 'name': item['title'], 'isDraft': False}}, {'part': 'snippet'})
            item['captionId'] = caption['id']; save_json(metadata_file, metadata)
        print('UPLOADED ' + locale + ': ' + item['watchUrl'], flush=True)

def verify_all():
    metadata_file = ROOT / 'youtube.json'; metadata = read_json(metadata_file); client = YouTube(); client.verify_channel(metadata['channelId'])
    for locale, item in metadata['items'].items():
        if not item.get('videoId') or not item.get('captionId'): raise RuntimeError('Video/caption upload incomplete: ' + locale)
        videos = client.get('videos', part='snippet,status,processingDetails', id=item['videoId']).get('items', [])
        if len(videos) != 1: raise RuntimeError('Video not found: ' + locale)
        video = videos[0]
        if video['snippet']['channelId'] != metadata['channelId'] or video['snippet']['title'] != item['title'] or video['snippet']['description'] != item['description']: raise RuntimeError('Video metadata mismatch: ' + locale)
        status = video['status']
        if status.get('privacyStatus') not in ['public', 'unlisted'] or not status.get('embeddable') or status.get('uploadStatus') != 'processed': raise RuntimeError('Video is not ready for the store: ' + locale)
        response = requests.get('https://www.youtube.com/oembed', params={'url': item['watchUrl'], 'format': 'json'}, timeout=30)
        if not response.ok: raise RuntimeError('Public embedding check failed: ' + locale)
        item['verifiedAt'] = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()); save_json(metadata_file, metadata)
        print('VERIFIED ' + locale + ': ' + item['watchUrl'], flush=True)

def main():
    parser = argparse.ArgumentParser(); parser.add_argument('command', choices=['auth', 'check', 'upload', 'verify']); parser.add_argument('--client-file'); parser.add_argument('--no-browser', action='store_true'); parser.add_argument('--lang', action='append', default=[]); args = parser.parse_args()
    try:
        if args.command == 'auth': authorize(args.client_file, args.no_browser)
        elif args.command == 'check': YouTube().verify_channel(read_json(ROOT / 'youtube.json')['channelId'])
        elif args.command == 'upload': upload_all(args.lang)
        else: verify_all()
    except (RuntimeError, OSError, requests.RequestException) as error:
        if isinstance(error, requests.RequestException): print('API network request failed: ' + type(error).__name__)
        else: print(str(error))
        raise SystemExit(1)

if __name__ == '__main__': main()
