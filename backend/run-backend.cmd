@echo off
REM KaamSetu backend — double-click or: run-backend.cmd
cd /d "%~dp0"
if not exist "venv\Scripts\python.exe" (
  echo ERROR: backend\venv not found. Run: .\scripts\setup.ps1
  pause
  exit /b 1
)
echo Starting KaamSetu backend on http://localhost:8000
venv\Scripts\python.exe kaamsetu.py
pause
