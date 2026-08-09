#!/usr/bin/env python3
"""Local launcher for Equation Outbreak: Road Scholar."""

from __future__ import annotations

import argparse
import contextlib
import http.server
import os
import socket
import socketserver
import sys
import threading
import webbrowser
from pathlib import Path


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        print(f"[game] {format % args}")


def port_available(host: str, port: int) -> bool:
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        return sock.connect_ex((host, port)) != 0


def choose_port(host: str, preferred: int) -> int:
    if port_available(host, preferred):
        return preferred
    with contextlib.closing(socket.socket(socket.AF_INET, socket.SOCK_STREAM)) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def main() -> int:
    parser = argparse.ArgumentParser(description="Launch Equation Outbreak in a browser.")
    parser.add_argument("--port", type=int, default=8080, help="Preferred local port")
    parser.add_argument("--no-browser", action="store_true", help="Do not open a browser automatically")
    args = parser.parse_args()

    game_dir = Path(__file__).resolve().parent
    os.chdir(game_dir)

    host = "127.0.0.1"
    port = choose_port(host, args.port)
    url = f"http://{host}:{port}/"

    class ReusableTCPServer(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True

    try:
        with ReusableTCPServer((host, port), QuietHandler) as server:
            print("Equation Outbreak: Road Scholar")
            print(f"Open: {url}")
            print("Press Ctrl+C to stop the game server.")
            if not args.no_browser:
                threading.Timer(0.6, lambda: webbrowser.open(url)).start()
            server.serve_forever()
    except KeyboardInterrupt:
        print("\nGame server stopped.")
        return 0
    except OSError as exc:
        print(f"Could not start the local server: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
