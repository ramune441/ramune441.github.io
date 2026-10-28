"""Validate local artwork, then publish the authorized Kura store listing update as one Play edit.

Default: local validation only. --publish sends the update; --verify reads it back.
Credentials remain outside the repository, in GOOGLE_APPLICATION_CREDENTIALS or ~/.kura/.
"""
from pathlib import Path
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import hashlib
import json
import os
import time
from PIL import Image

HERE = Path(__file__).resolve().parent
API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications/app.kura.photos/edits'
UPLOAD = 'https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/app.kura.photos/edits'
TYPES = {'phoneScreenshots':'store-image-{}.png', 'featureGraphic':'store-image-feature.png'}
# The web store shows every form factor's screenshots in one row, so tablet sets repeat the phone ones; keep them empty.
EMPTY = ['sevenInchScreenshots', 'tenInchScreenshots']

def session():
    from google.oauth2.service_account import Credentials
    from google.auth.transport.requests import AuthorizedSession
    key = Path(os.environ.get('GOOGLE_APPLICATION_CREDENTIALS', str(Path.home()/'.kura/play-service-account.json')))
    return AuthorizedSession(Credentials.from_service_account_file(str(key), scopes=['https://www.googleapis.com/auth/androidpublisher']))

def request(client, method, url, **kwargs):
    for attempt in range(4):
        result = client.request(method,url,timeout=90,**kwargs)
        if result.status_code != 429: break
        time.sleep(2**attempt)
    if not result.ok:
        raise RuntimeError(f'{method} {url}: {result.status_code} {result.text[:1200]}')
    return result.json() if result.content else {}

def assets(lang, order, image_type):
    pattern = TYPES[image_type]
    return [HERE/'images/store'/lang/(pattern.format(i)) for i in (order if '{}' in pattern else [0])]

def validate_local(data):
    assert data['packageName'] == 'app.kura.photos'
    assert data['screenshotOrder'] == [1,2,3,4,5]
    codes = []
    for lang, entry in data['locales'].items():
        codes += entry['playLanguages']
        for key, limit in [('title',30),('shortDescription',80),('fullDescription',4000)]:
            assert 0 < len(entry['listing'][key]) <= limit, (lang,key)
        for typ in TYPES:
            for image in assets(lang,data['screenshotOrder'],typ):
                with Image.open(image) as png:
                    assert png.mode == 'RGB', (image,png.mode)
                    assert png.size == ((1024,500) if typ=='featureGraphic' else (1080,1920)), (image,png.size)
    assert len(codes)==len(set(codes)), 'Duplicate Play language'

def verify_edit(client, edit, data):
    actual = {item['language']:item for item in request(client,'GET',f'{API}/{edit}/listings')['listings']}
    for lang, entry in data['locales'].items():
        for code in entry['playLanguages']:
            for key, value in entry['listing'].items():
                assert actual[code][key] == value, (code,key)
            for typ in TYPES:
                images = request(client,'GET',f'{API}/{edit}/listings/{code}/{typ}').get('images',[])
                expected = [hashlib.sha256(p.read_bytes()).hexdigest() for p in assets(lang,data['screenshotOrder'],typ)]
                assert [p['sha256'] for p in images] == expected, (code,typ)
            for typ in EMPTY:
                assert not request(client,'GET',f'{API}/{edit}/listings/{code}/{typ}').get('images'), (code,typ)
    return {'listings':len(actual),'imageSets':len(actual)*len(TYPES),'verified':True}

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish',action='store_true')
    parser.add_argument('--verify',action='store_true')
    args = parser.parse_args()
    data = json.loads((HERE/'store-listing.json').read_text(encoding='utf-8'))
    validate_local(data)
    listing_count = sum(len(entry['playLanguages']) for entry in data['locales'].values())
    image_count = sum(len(assets(lang,data['screenshotOrder'],typ)) * len(entry['playLanguages'])
                      for lang,entry in data['locales'].items() for typ in TYPES)
    print(f'Local validation passed: {len(data["locales"])} locales, {listing_count} Play listings, {image_count} image placements',flush=True)
    if not (args.publish or args.verify): return
    client = session()
    edit = request(client,'POST',API,json={})['id']
    committed = False
    receipt = HERE.parent/'_probe/kura-play-publish.json'
    receipt.parent.mkdir(exist_ok=True)
    try:
        if args.publish:
            def upload_language(lang, entry, code):
                worker = session()
                request(worker,'PUT',f'{API}/{edit}/listings/{code}',json=entry['listing'])
                for typ in [*TYPES, *EMPTY]:
                    request(worker,'DELETE',f'{API}/{edit}/listings/{code}/{typ}')
                    for png in assets(lang,data['screenshotOrder'],typ) if typ in TYPES else []:
                        request(worker,'POST',f'{UPLOAD}/{edit}/listings/{code}/{typ}',params={'uploadType':'media'},headers={'Content-Type':'image/png'},data=png.read_bytes())
                print(f'{code}: copy and {len(data["screenshotOrder"])+1} images uploaded',flush=True)
            with ThreadPoolExecutor(max_workers=4) as pool:
                futures = [pool.submit(upload_language,lang,entry,code) for lang,entry in data['locales'].items() for code in entry['playLanguages']]
                for task in as_completed(futures): task.result()
            result = verify_edit(client,edit,data)
            request(client,'POST',f'{API}/{edit}:validate')
            # Preserve an unrelated pending review rather than silently cancelling it.
            commit = request(client,'POST',f'{API}/{edit}:commit',params={'changesInReviewBehavior':'ERROR_IF_IN_REVIEW'})
            committed = True
            receipt.write_text(json.dumps({'editId':edit,'commit':commit,**result},ensure_ascii=False,indent=2),encoding='utf-8')
            print('Committed the verified Play listing update',flush=True)
        else:
            result = verify_edit(client,edit,data)
            print(json.dumps(result),flush=True)
    finally:
        if not committed: request(client,'DELETE',f'{API}/{edit}')

if __name__ == '__main__': main()
