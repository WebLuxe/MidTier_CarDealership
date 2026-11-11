@echo off
cd /d "%~dp0"
if not exist node_modules call npm install
call node src/build.mjs all
start "" http://localhost:4100/
node serve.mjs 4100
pause
