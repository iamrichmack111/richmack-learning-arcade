#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
PORT="${1:-8113}"
printf 'Laundry Night: http://localhost:%s\n' "$PORT"
python3 -m http.server "$PORT"
