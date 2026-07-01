import urllib.request
import urllib.error
import json

url = 'https://clr-responsive-crm.onrender.com/api/auth/login'
data = json.dumps({'username': 'admin', 'password': 'admin'}).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'}, method='POST')

try:
    with urllib.request.urlopen(req) as resp:
        body = resp.read().decode('utf-8', errors='replace')
        print('STATUS', resp.status, resp.reason)
        print('HEADERS', dict(resp.getheaders()))
        print('BODY', body)
except urllib.error.HTTPError as e:
    body = e.read().decode('utf-8', errors='replace')
    print('STATUS', e.code, e.reason)
    print('HEADERS', dict(e.headers))
    print('BODY', body)
except Exception as e:
    print('ERROR', str(e))
