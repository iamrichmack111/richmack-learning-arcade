#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

PORT="$(python3 - <<'PY'
import socket
for p in range(8110, 8150):
    with socket.socket() as s:
        try:
            s.bind(("127.0.0.1", p))
            print(p)
            raise SystemExit
        except OSError:
            pass
raise SystemExit("No free port found between 8110 and 8149")
PY
)"

URL="http://127.0.0.1:${PORT}"
echo "Spelling Séance"
echo "Opening: $URL"

(
  sleep 0.8
  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL" >/dev/null 2>&1 || true
  elif command -v open >/dev/null 2>&1; then
    open "$URL" >/dev/null 2>&1 || true
  fi
) &

python3 -m http.server "$PORT" --bind 127.0.0.1
