@echo off
cd /d "%~dp0"
echo === LQA Demo ===
if not exist node_modules call npm install
echo.
echo Starting dev server... close this window to stop.
call npm run dev
echo.
echo Server stopped. Press any key to close.
pause >nul
