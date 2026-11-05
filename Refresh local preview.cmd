@echo off
cd /d "%~dp0"
node scripts/prepare.mjs
if errorlevel 1 (
  echo.
  echo Preview could not be refreshed. Check games.json and that Node.js is installed.
  pause
  exit /b 1
)
echo.
echo Local preview updated. Reopen or reload index.html.
pause
