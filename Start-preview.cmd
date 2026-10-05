@echo off
cd /d "%~dp0"
node scripts/serve.mjs --dir public
pause
