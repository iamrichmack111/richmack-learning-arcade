#!/usr/bin/env python3
import http.server
import os
import socketserver
import threading
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
os.chdir(ROOT)

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        print("[arcade]", fmt % args)

class Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

with Server(("127.0.0.1", 0), Handler) as httpd:
    port = httpd.server_address[1]
    url = f"http://127.0.0.1:{port}/"
    print(f"Richmack Learning Arcade: {url}")
    threading.Timer(0.5, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nArcade stopped.")
