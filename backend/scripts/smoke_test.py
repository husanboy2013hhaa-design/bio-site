"""End-to-end smoke test: starts the dev server, exercises the API, stops it."""
import json
import subprocess
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE = "http://127.0.0.1:8765/api/v1"
ROOT = Path(__file__).resolve().parent.parent
PY = sys.executable


def call(method, path, body=None, token=None):
    req = urllib.request.Request(f"{BASE}{path}", method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    data = json.dumps(body).encode() if body is not None else None
    with urllib.request.urlopen(req, data, timeout=30) as resp:
        return resp.status, json.loads(resp.read() or b"{}")


server = subprocess.Popen(
    [PY, "manage.py", "runserver", "127.0.0.1:8765", "--noreload"],
    cwd=ROOT,
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
try:
    for _ in range(40):
        time.sleep(0.5)
        try:
            urllib.request.urlopen(f"{BASE}/schema/", timeout=2)
            break
        except Exception:
            continue

    # unique username per run
    n = int(time.time())
    s, reg = call(
        "POST",
        "/auth/register/",
        {"email": f"smoke{n}@test.uz", "username": f"smoke{n}", "password": "S3cure-pass!"},
    )
    print(f"REGISTER: {s} id={reg['user']['id']} slug={reg['user']['username']}")
    token = reg["access"]

    s, me = call("GET", "/profile/me/", token=token)
    print(f"PROFILE/ME: {s} slug={me['slug']} theme={me['theme']['background']}")

    s, link = call(
        "POST",
        "/links/",
        {"title": "YouTube", "url": "https://youtube.com/@smoke"},
        token=token,
    )
    print(f"LINK CREATE: {s} id={link['id']} position={link['position']}")

    s, pub = call("GET", f"/public/{me['slug']}/")
    print(f"PUBLIC: {s} links={len(pub['links'])} bg={pub['theme']['background']}")

    s, _ = call("POST", f"/links/{link['id']}/click/")
    s, pub = call("GET", f"/public/{me['slug']}/")
    print(f"CLICK: {s} count={pub['links'][0]['clicks']}")

    s, ov = call("GET", "/analytics/overview/", token=token)
    print(f"ANALYTICS: {s} total_clicks={ov['total_clicks']} views={ov['profile_views']}")
    print("SMOKE TEST: ALL OK")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.read().decode()[:500]}")
    sys.exit(1)
finally:
    server.terminate()
    try:
        server.wait(timeout=10)
    except subprocess.TimeoutExpired:
        server.kill()
