@echo off
REM KaamSetu backend — double-click or: run-backend.cmd
cd /d "%~dp0"
if exist "venv\Scripts\python.exe" (
  echo Starting KaamSetu backend on http://localhost:8000
  venv\Scripts\python.exe kaamsetu.py
) else (
  echo Starting KaamSetu backend on http://localhost:8000
  python kaamsetu.py
)
pause
