@echo off
echo Starting Agent Video Editor...
echo.
cd /d "%~dp0"

if not exist "app\node_modules" (
    echo Dependencies not found. Running setup first...
    call setup.bat
)

call npm --prefix app start
pause

