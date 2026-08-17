#!/usr/bin/env python3

from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from threading import Thread
from urllib.request import urlopen
import contextlib
import os
import sys

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)

class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

server = ThreadingHTTPServer(("127.0.0.1", 0), QuietHandler)
port = server.server_address[1]

thread = Thread(target=server.serve_forever, daemon=True)
thread.start()

paths = [
    "/",
    "/arcade.html",
    "/parent-login.html",
    "/parent-portal.html",
]

games_dir = ROOT / "games"

for game_dir in sorted(games_dir.iterdir()):
    if game_dir.is_dir() and (game_dir / "index.html").exists():
        paths.append(f"/games/{game_dir.name}/index.html")

failed = []

print(f"HTTP smoke test: localhost:{port}")
print(f"Checking {len(paths)} routes...\n")

try:
    for path in paths:
        url = f"http://127.0.0.1:{port}{path}"

        try:
            with contextlib.closing(urlopen(url, timeout=5)) as response:
                status = response.status

            if status == 200:
                print(f"PASS  {status}  {path}")
            else:
                print(f"FAIL  {status}  {path}")
                failed.append((path, status))

        except Exception as exc:
            print(f"FAIL       {path}  {exc}")
            failed.append((path, str(exc)))

finally:
    server.shutdown()
    server.server_close()

print()

if failed:
    print(f"HTTP smoke FAILED: {len(failed)} route(s)")
    sys.exit(1)

game_count = len(paths) - 4

print(
    f"HTTP smoke PASS: "
    f"{len(paths)} routes, "
    f"{game_count} games"
)
