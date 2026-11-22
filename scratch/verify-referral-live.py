import html
import json
import re
import urllib.parse
import urllib.request

android = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36'
for path in ['/join?ref=NBD-295', '/r/NBD-295']:
    request = urllib.request.Request('https://edata.com.ng' + path, headers={'User-Agent': android, 'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(request, timeout=30) as response:
        body = response.read().decode('utf-8')
        store = html.unescape(re.search(r'href="([^"]+)" id="store-btn"', body).group(1))
        query = urllib.parse.parse_qs(urllib.parse.urlsplit(store).query)
        referral = urllib.parse.parse_qs(query['referrer'][0])
        signup = html.unescape(re.search(r'href="([^"]+)" class="btn-secondary"', body).group(1))
        assert referral['ref'] == ['NBD-295'] and referral.get('click_id')
        assert 'var isAndroid = true;' in body
        assert '/app' in signup and 'mode=signup' in signup and 'ref=NBD-295' in signup
        assert 'window.location.href = playStoreUrl;' in body
        print(json.dumps({'path': path, 'status': response.status, 'android': True, 'play_referral': referral['ref'][0], 'click_tracking': True, 'web_signup': signup, 'cache_control': response.headers.get('Cache-Control')}))
