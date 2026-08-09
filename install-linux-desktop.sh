#!/usr/bin/env bash
set -e
HERE="$(cd "$(dirname "$0")" && pwd)"
APPDIR="$HOME/.local/share/applications"
mkdir -p "$APPDIR"
DESKTOP="$APPDIR/richmack-learning-arcade.desktop"
cat > "$DESKTOP" <<EOD
[Desktop Entry]
Type=Application
Name=Richmack Learning Arcade
Comment=Launch the Richmack educational game library
Exec=bash -lc 'cd "$HERE" && ./start.sh'
Terminal=false
Categories=Game;Education;
StartupNotify=true
EOD
chmod +x "$DESKTOP"
if [ -d "$HOME/Desktop" ]; then
  cp "$DESKTOP" "$HOME/Desktop/Richmack Learning Arcade.desktop"
  chmod +x "$HOME/Desktop/Richmack Learning Arcade.desktop"
  gio set "$HOME/Desktop/Richmack Learning Arcade.desktop" metadata::trusted true 2>/dev/null || true
fi
update-desktop-database "$APPDIR" 2>/dev/null || true
echo "Installed Richmack Learning Arcade desktop launcher."
