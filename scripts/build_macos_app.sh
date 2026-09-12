#!/usr/bin/env bash
# ==============================================================================
# Build Standalone macOS Application Bundle: FRIDAY.app
# ==============================================================================
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$DIR/FRIDAY.app"
CONTENTS_DIR="$APP_DIR/Contents"
MACOS_DIR="$CONTENTS_DIR/MacOS"
RESOURCES_DIR="$CONTENTS_DIR/Resources"

echo "[*] Creating macOS Application bundle at $APP_DIR..."

rm -rf "$APP_DIR"
mkdir -p "$MACOS_DIR"
mkdir -p "$RESOURCES_DIR"

# 1. Write Info.plist
cat << 'EOF' > "$CONTENTS_DIR/Info.plist"
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>FRIDAY</string>
    <key>CFBundleIdentifier</key>
    <string>com.friday.assistant</string>
    <key>CFBundleName</key>
    <string>FRIDAY</string>
    <key>CFBundleDisplayName</key>
    <string>FRIDAY Assistant</string>
    <key>CFBundleIconFile</key>
    <string>AppIcon</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>2.5.0</string>
    <key>CFBundleVersion</key>
    <string>2.5.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>12.0</string>
    <key>NSHighResolutionCapable</key>
    <true/>
</dict>
</plist>
EOF

# 2. Write Executable Launcher
cat << EOF > "$MACOS_DIR/FRIDAY"
#!/usr/bin/env bash
PROJECT_DIR="$DIR"
cd "\$PROJECT_DIR"

# Ensure local environment PATH
export PATH="/opt/homebrew/bin:/usr/local/bin:\$PATH"

# 1. Start Ollama if not running
if ! curl -s http://127.0.0.1:11434/api/tags > /dev/null 2>&1; then
    if command -v ollama > /dev/null 2>&1; then
        ollama serve > /dev/null 2>&1 &
        sleep 2
    fi
fi

# 2. Check if FRIDAY backend is running
if ! curl -s http://127.0.0.1:8080/api/health > /dev/null 2>&1; then
    PYTHON_BIN="\$PROJECT_DIR/.venv/bin/python"
    if [ ! -f "\$PYTHON_BIN" ]; then
        PYTHON_BIN="python3"
    fi
    nohup "\$PYTHON_BIN" -m backend.main > /tmp/friday_app.log 2>&1 &
    sleep 2
fi

# 3. Open in default browser or web app mode
open "http://127.0.0.1:8080"
EOF

chmod +x "$MACOS_DIR/FRIDAY"

# 3. Copy Icon to Resources
if [ -f "$DIR/web/logo.svg" ]; then
    cp "$DIR/web/logo.svg" "$RESOURCES_DIR/logo.svg"
fi
if [ -f "$DIR/web/favicon.svg" ]; then
    cp "$DIR/web/favicon.svg" "$RESOURCES_DIR/favicon.svg"
fi

echo "[✓] Successfully generated FRIDAY.app!"
echo "    You can launch it via: open '$APP_DIR'"
