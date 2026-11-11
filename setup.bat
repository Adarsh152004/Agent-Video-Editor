@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo        Agent Video Editor - Setup Wizard (Windows)
echo ===================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 20 or later from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Found Node.js %NODE_VER%

:: 2. Check Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    where py >nul 2>nul
    if %errorlevel% neq 0 (
        echo [ERROR] Python 3.11+ is not installed or not in PATH!
        echo Please install Python 3.11+ from https://www.python.org/
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=py -3
    )
) else (
    set PYTHON_CMD=python
)
echo [OK] Using Python: %PYTHON_CMD%

:: 3. Check FFmpeg
where ffmpeg >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] ffmpeg is not found in PATH!
    echo Video rendering and compositing require ffmpeg.
    echo Please install ffmpeg (e.g. 'winget install Gyan.FFmpeg' or from https://ffmpeg.org/^)
    echo.
) else (
    echo [OK] Found FFmpeg in PATH
)

:: 4. Create Virtual Environment
echo.
echo [1/4] Setting up Python virtual environment in .venv...
if not exist ".venv" (
    %PYTHON_CMD% -m venv .venv
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to create .venv!
        pause
        exit /b 1
    )
)
echo [OK] Virtual environment ready.

:: 5. Install Python Dependencies
echo.
echo [2/4] Installing Python requirements...
.venv\Scripts\python.exe -m pip install --upgrade pip --quiet
.venv\Scripts\python.exe -m pip install -r requirements.txt --quiet
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies!
    pause
    exit /b 1
)

:: Install Playwright Chromium
echo Installing Playwright Chromium browser...
.venv\Scripts\python.exe -m playwright install chromium
echo [OK] Python dependencies and Playwright ready.

:: 6. Install Node Dependencies & Build Web App
echo.
echo [3/4] Installing Node dependencies and building web app...
call npm --prefix app install --no-fund --no-audit
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Node dependencies in app/!
    pause
    exit /b 1
)

call npm --prefix app run build
if %errorlevel% neq 0 (
    echo [ERROR] Web app build failed!
    pause
    exit /b 1
)
echo [OK] Web application built successfully.

:: 7. Link Claude Code skills if needed
if not exist ".claude\skills" (
    if not exist ".claude" mkdir .claude
    mklink /J ".claude\skills" "skills" >nul 2>nul
)

echo.
echo ===================================================
echo          [SUCCESS] Setup Completed!
echo ===================================================
echo.
echo You can now launch the editor anytime by running:
echo    start.bat
echo or running:
echo    npm start
echo.
pause

