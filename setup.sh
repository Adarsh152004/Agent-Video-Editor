#!/usr/bin/env bash
set -e

echo "==================================================="
echo "        Agent Video Editor - Setup Wizard (Unix)   "
echo "==================================================="
echo ""

# 1. Check Node.js
if ! command -v node >/dev/null 2>&1; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi
echo "[OK] Found Node.js $(node -v)"

# 2. Check Python
PYTHON_CMD=""
if command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "[ERROR] Python 3.11+ is not installed!"
    exit 1
fi
echo "[OK] Found Python ($PYTHON_CMD)"

# 3. Check FFmpeg
if ! command -v ffmpeg >/dev/null 2>&1; then
    echo "[WARNING] ffmpeg is not installed or not in PATH!"
    echo "Install via: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Ubuntu/Debian)"
    echo ""
else
    echo "[OK] Found FFmpeg in PATH"
fi

# 4. Setup Python Virtual Environment
echo ""
echo "[1/4] Setting up Python virtual environment in .venv..."
if [ ! -d ".venv" ]; then
    $PYTHON_CMD -m venv .venv
fi
echo "[OK] Virtual environment ready."

# 5. Install Python dependencies
echo ""
echo "[2/4] Installing Python requirements..."
.venv/bin/pip install --upgrade pip --quiet
.venv/bin/pip install -r requirements.txt --quiet

# Check for macOS Apple Silicon
if [[ "$(uname)" == "Darwin" && "$(uname -m)" == "arm64" ]]; then
    echo "Detected Apple Silicon: installing mlx-whisper for accelerated transcription..."
    .venv/bin/pip install mlx-whisper --quiet || true
fi

echo "Installing Playwright Chromium browser..."
.venv/bin/python -m playwright install chromium
echo "[OK] Python dependencies ready."

# 6. Install Node dependencies & build app
echo ""
echo "[3/4] Installing Node dependencies and building web app..."
npm --prefix app install --no-fund --no-audit
npm --prefix app run build
echo "[OK] Web app built successfully."

# 7. Link Claude Code skills
if [ ! -d ".claude/skills" ]; then
    mkdir -p .claude
    ln -s ../skills .claude/skills 2>/dev/null || true
fi

echo ""
echo "==================================================="
echo "          [SUCCESS] Setup Completed!               "
echo "==================================================="
echo ""
echo "You can now start the application with:"
echo "   ./start.sh"
echo "or:"
echo "   npm start"
echo ""

