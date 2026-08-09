#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT="${1:-8080}"
echo "Letter Raider is running at http://localhost:${PORT}"
if command -v xdg-open >/dev/null 2>&1; then
  (sleep 1; xdg-open "http://localhost:${PORT}" >/dev/null 2>&1 || true) &
elif command -v open >/dev/null 2>&1; then
  (sleep 1; open "http://localhost:${PORT}" >/dev/null 2>&1 || true) &
fi
python3 -m http.server "$PORT"
