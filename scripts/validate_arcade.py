#!/usr/bin/env python3
"""Fast, dependency-free integrity checks for Richmack Learning Arcade."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
JS = ROOT / "arcade.js"
README = ROOT / "README.md"

errors = []
text = JS.read_text(encoding="utf-8")
slugs = re.findall(r"slug:'([^']+)'", text)
titles = re.findall(r"title:'([^']+)'", text)

if not slugs:
    errors.append("arcade.js contains no games")
if len(slugs) != len(set(slugs)):
    errors.append("duplicate game slug detected")
if len(titles) != len(set(titles)):
    errors.append("duplicate game title detected")

for slug in slugs:
    game_dir = ROOT / "games" / slug
    if not game_dir.is_dir():
        errors.append(f"missing game directory: games/{slug}")
        continue
    if not (game_dir / "index.html").is_file():
        errors.append(f"missing entry point: games/{slug}/index.html")
    if not (game_dir / "README.md").is_file():
        errors.append(f"missing README: games/{slug}/README.md")

extra_dirs = sorted(
    p.name for p in (ROOT / "games").iterdir()
    if p.is_dir() and p.name not in slugs
)
if extra_dirs:
    errors.append("unlisted game directories: " + ", ".join(extra_dirs))

readme = README.read_text(encoding="utf-8")
if f"{len(slugs)} educational games" not in readme:
    errors.append(f"README game count does not match manifest count ({len(slugs)})")

if errors:
    print("Arcade validation FAILED")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print(f"Arcade validation PASS: {len(slugs)} games, {len(set(slugs))} unique slugs")
