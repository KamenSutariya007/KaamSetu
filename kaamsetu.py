#!/usr/bin/env python
"""
KaamSetu backend — run from project root:
    python kaamsetu.py

Uses backend\\venv if present.
"""
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BACKEND = ROOT / 'backend'
SCRIPT = BACKEND / 'kaamsetu.py'
venv_python = BACKEND / 'venv' / 'Scripts' / 'python.exe'
python = venv_python if venv_python.exists() else sys.executable

if not SCRIPT.exists():
    raise SystemExit(f'Missing {SCRIPT}')

raise SystemExit(subprocess.call([str(python), str(SCRIPT)], cwd=BACKEND))
