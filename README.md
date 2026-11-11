# Agent Video Editor

An automated, studio-grade video editing suite powered by local AI coding agents. Pick your audio or footage, select a visual style or explainer theme, and let your AI agent follow specialized editing skills to transcribe, design motion graphics, animate flowcharts, and composite broadcast-ready 1080p videos locally.

Everything runs on your own machine. Transcriptions run locally via Whisper, and your original footage is never modified.

```
Browser UI (127.0.0.1) ──► app/ (Node.js web app) ──► Agent CLI (Claude Code, Codex, or Kimi)
                               │                              │ follows skills
                               │ streams & serves             ▼
                               └──────── edit/<project>/ ◄── skills/ + ffmpeg + Python + Remotion
```

---

## ⚡ Quick Start

### Prerequisites
Before starting, ensure you have:
1. **Node.js 20+** installed ([Download](https://nodejs.org/))
2. **Python 3.11+** installed ([Download](https://www.python.org/))
3. **FFmpeg** installed and added to PATH ([Download](https://ffmpeg.org/))
4. One signed-in Agent CLI: [Claude Code](https://docs.claude.com/en/docs/claude-code), Codex, or [Kimi Code](https://moonshotai.github.io/kimi-code/).

---

### Windows (1-Click)
1. Double-click **`setup.bat`** (or run `setup.bat` in CMD/PowerShell).
2. Once complete, double-click **`start.bat`**.
3. Your browser will automatically open the authenticated editor link!

---

### macOS / Linux (1-Click)
1. Make scripts executable and run setup:
   ```bash
   chmod +x *.sh
   ./setup.sh
   ```
2. Launch the application:
   ```bash
   ./start.sh
   ```
3. Open the printed link (`http://127.0.0.1:4317/#/?t=...`) in your browser.

---

### Manual Setup
If you prefer running commands manually:

```bash
# 1. Create Python virtual environment
python3 -m venv .venv
# On Windows: py -3 -m venv .venv

# 2. Install Python dependencies
# On Windows: .venv\Scripts\python.exe -m pip install -r requirements.txt
# On macOS/Linux: .venv/bin/pip install -r requirements.txt
pip install -r requirements.txt
playwright install chromium

# 3. Install web app dependencies and build
npm --prefix app install
npm --prefix app run build

# 4. Start the server
npm start
```

---

## 🎨 Themes & Visual Styles

The editor includes rich motion graphics styles configured in `skills/`:

- **Clean Tech (Kinetic Type & 3D Isometric)**: High-production explainer style featuring:
  - 3D Isometric projection cubes, token slicers, and bar chart comparison towers.
  - Self-drawing conduits with animated energy pulses.
  - Manim-style neural network synapses and $O(N^2)$ mathematical curves.
  - Synthesized ambient Lo-Fi soundbed and motion sound effects (whooshes, clicks, chimes).
- **Warm Paper Sketch**: Warm paper canvas, cobalt signal, yellow marker highlights, clean typography, and IDE code windows.
- **Blackboard Live Pen**: Pure black canvas with live handwritten tablet pen strokes, bright meaning-based inks, and zooming infinite canvas.
- **Dark Sketch Explainer**: Charcoal aesthetic with soft-white hand-drawn line art and instant on-cue builds.
- **Navy Amber**: Engineering grid canvas with royal navy and golden amber accents, typewriter titles, and floating corner spheres.

---

## 🚀 How to Use the App

1. **Open the Web UI**: Visit the link printed on startup (e.g. `http://127.0.0.1:4317/#/?t=...`).
2. **Settings**:
   - Ensure the workspace points to the repository root.
   - Verify your agent CLI (`kimi`, `claude`, or `codex`) is recognized.
   - Python path defaults to the workspace `.venv` interpreter (`.venv/Scripts/python.exe` on Windows or `.venv/bin/python` on Unix).
3. **New Edit**:
   - Click **+ New Edit**.
   - Select edit format: **Long-form Video** or **Intro**.
   - Pick your footage or audio voiceover (supports `.mp3`, `.wav`, `.mp4`, `.mov`).
   - Select a visual theme (e.g. **Clean Tech**).
   - Set loudness normalization and captions preferences.
   - Click **Start Edit**.
4. **Live Execution & Export**:
   - Monitor live progress through transcription, directive validation, graphics generation, and compositing.
   - Play the final 1080p master video directly in the web player.
   - Master videos and receipts are stored safely under `edit/<project_name>/output.mp4`.

---

## 📁 Repository Layout

```
├── app/                        # Web application (Node.js + React + Vite + Tailwind)
│   ├── src/client/             # UI components, theme pickers, video preview
│   └── src/server/             # Local API, streaming agent process manager, media prober
├── skills/                     # Editing skill packs followed by AI agents
│   ├── presenter-intro-editor/ # Intro editing workflow
│   ├── presenter-long-form-editor/ # Long-form tutorial & explainer workflow
│   │   └── scripts/            # Python render engines, transcription & verification tools
│   ├── video-use/              # Video generation and inspection guidance
│   └── remotion-*/             # Remotion motion graphics skills
├── requirements.txt            # Python dependencies
├── package.json                # Root NPM scripts
├── setup.bat / setup.sh        # One-click environment installer
├── start.bat / start.sh        # One-click server launcher
├── AGENTS.md / CLAUDE.md       # Global rules for coding agents
└── README.md                   # Project documentation
```

---

## 🔒 Privacy & Safety Rules

- **Offline / Local First**: Media never leaves your machine unless you explicitly enable cloud transcription for a project.
- **Non-Destructive**: Original footage and audio are never altered.
- **Isolated Projects**: All outputs, logs, and cache files reside under `edit/<project>/`.

---

## 🛠️ Troubleshooting

- **FFmpeg not found**: Ensure FFmpeg is installed and accessible from your terminal (`ffmpeg -version`).
- **Python Path in Agent**: The agent automatically resolves forward-slash paths (`/`) for cross-platform compatibility across Windows Bash, PowerShell, and Unix shells.
- **Mark of the Web / Antivirus Warnings on Windows**: If Windows Defender or SmartScreen restricts `ffprobe`, the built-in media prober automatically falls back to `ffmpeg` without interrupting your workflow.

---

## License
MIT
