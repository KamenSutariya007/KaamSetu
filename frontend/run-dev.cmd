@echo off
REM KaamSetu frontend — double-click or: run-dev.cmd
cd /d "%~dp0"
echo Starting KaamSetu frontend on http://localhost:5173
call npm.cmd run dev
pause
