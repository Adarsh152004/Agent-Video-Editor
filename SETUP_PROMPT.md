# Setup prompt

Open a coding agent (Claude Code, Codex, Kimi or similar) in the root of this repository, then paste
everything inside the box below as one message. The agent installs every dependency, sets up the app
and gives you the link to open it. It asks before anything that needs your password or changes
system-wide software.

````text
Set up this repository so its local video editor app runs on my machine. You are in the repository
root. Work through the steps in order, verify each one, and do not skip any.

Rules:
- Do the work yourself. Ask me only before: installing system-wide software (brew, apt, winget,
  pacman), anything that needs sudo or my password, overwriting an existing file outside this
  repository, and installing an agent CLI.
- Never ask me for API keys, and never write secrets into the repository.
- Only change files inside this repository, except for system packages I approve and the app's
  settings file in step 6.
- Before you read or run a downloaded script, check what it does. If a step fails, show me the exact
  error, fix the cause and retry. Do not report success on a step you could not verify.

1. Check the tools. Report each version:
   - git
   - Node.js 22 or later, with npm
   - Python 3.11 or later
   - ffmpeg and ffprobe
   If one is missing or too old, tell me the exact install command for my OS (for example
   `brew install node@22 python@3.12 ffmpeg` on macOS, apt on Debian/Ubuntu, or `winget` on Windows),
   wait for my approval, then install it. Native Windows is supported; use its `.venv\Scripts\python.exe`
   path instead of the Unix `.venv/bin/python` path.

2. Create the Python environment at `.venv` in the repository root, and install the packages:
   - Create `.venv` with Python 3.11 or later: `python3 -m venv .venv` on macOS/Linux, or
     `py -3 -m venv .venv` on Windows, using an installed Python 3.11+ version.
   - Use `.venv\Scripts\python.exe` on Windows or `.venv/bin/python` on macOS/Linux for all
     following Python commands.
   - `<venv-python> -m pip install --upgrade pip`
   - `<venv-python> -m pip install requests librosa matplotlib pillow numpy playwright`
   - Local transcription: on macOS with Apple Silicon, install `mlx-whisper`. Anywhere else, install
     `faster-whisper`.
   - `<venv-python> -m playwright install chromium`
   Verify with: `<venv-python> -c "import requests, librosa, PIL, playwright; print('ok')"`, and
   import the whisper package you installed (`mlx_whisper` or `faster_whisper`).

3. Install the third-party skills into `skills/`. They are not stored in this repository, and the
   repository's .gitignore already ignores them.
   - video-use (MIT licence), pinned to a known commit:
     `git clone https://github.com/browser-use/video-use skills/video-use`
     `git -C skills/video-use checkout 43cfc566833548093455c9d4a46bd69913b7e552`
   - The Remotion skills, from a shallow clone in a temporary folder outside the repository:
     on Windows PowerShell, create `$tmp = Join-Path $env:TEMP ([guid]::NewGuid().ToString())`,
     then clone with `git clone --depth 1 https://github.com/remotion-dev/skills "$tmp/remotion-skills"`
     and copy the matching folders with
     `Get-ChildItem (Join-Path $tmp 'remotion-skills\skills') -Directory -Filter 'remotion-*' | ForEach-Object { Copy-Item $_.FullName -Destination 'skills' -Recurse }`.
     On macOS/Linux, use `tmp="$(mktemp -d)"`, the same `git clone` command, and
     `cp -R "$tmp"/remotion-skills/skills/remotion-* skills/`.
     If a `skills/remotion-*` folder already exists, ask me before replacing it.
   Verify that `skills/` now contains `presenter-intro-editor`, `presenter-long-form-editor`,
   `video-use`, and each `remotion-*` skill listed in `skills-lock.json`. Each one needs a SKILL.md.
   Then link the skills for Claude Code, unless `.claude/skills` already exists. On Windows, create
   a directory junction with `New-Item -ItemType Junction -Path .claude\skills -Target (Resolve-Path skills)`;
   on macOS/Linux use `mkdir -p .claude && ln -s ../skills .claude/skills`.

4. Build and test the app:
   - `cd app && npm ci && npm test && npm run build`
   All tests must pass and the build must succeed.

5. Pick the agent CLI that the app will run. The app supports `claude` (Claude Code), `codex` and
   `kimi`. Look for each one on PATH, and also in `~/.local/bin/` and `~/.kimi-code/bin/`. Run
   `<cli> --version` for each one you find.
   - If exactly one is installed, use it.
   - If several are installed, ask me which one to use.
   - If none is installed, stop and ask which one I want. Show me that tool's official install
     instructions, and install it only after I approve. Then remind me to sign in to it once in a
     terminal, because the app runs it without a window.

6. Write the app's settings file, `~/.agent-video-editor/settings.json`. If it already exists, show it
   to me and ask before changing it. Use absolute paths:
   ```json
   {
     "workspace": "<absolute path of this repository>",
     "agent": "<claude | codex | kimi>",
     "agentPath": "<absolute path of that CLI>",
     "model": "",
     "python": "<absolute path to the .venv interpreter>"
   }
   ```
   Leave `model` empty to use the agent's default model. Do not add any other fields; the app fills
   them in on first start.

7. Start the app and check that it runs:
   - From `app/`, run `npm start -- --no-open` in the background. On Windows PowerShell, use
     `Start-Process -FilePath npm.cmd -ArgumentList 'start','--','--no-open' -WorkingDirectory (Join-Path (Get-Location) 'app') -RedirectStandardOutput (Join-Path (Get-Location) 'app\server.log') -RedirectStandardError (Join-Path (Get-Location) 'app\server-error.log')`.
   - The server prints a line like `Agent Video Editor running at http://127.0.0.1:4317/#/?t=<token>`.
     Copy that full link, including the `?t=` token; without the token the app refuses requests.
   - Check that the link answers with HTTP 200.
   - Leave the server running.

8. Report back with:
   - the versions you found or installed;
   - the agent CLI you configured;
   - anything you skipped and why;
   - the full app link from step 7.
   Tell me that each time I start the app (`cd app && npm start`, or `npm run dev` while developing),
   it prints a new link with a fresh token.
````
