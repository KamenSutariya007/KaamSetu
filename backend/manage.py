#!/usr/bin/env python
"""Django's command-line utility for administrative tasks.

Re-runs under backend\\venv when present so system Python cannot miss packages (e.g. daphne).
"""
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
VENV_PYTHON = BACKEND_DIR / 'venv' / 'Scripts' / 'python.exe'


def _running_under_venv() -> bool:
    if not VENV_PYTHON.exists():
        return True
    try:
        return Path(sys.executable).resolve() == VENV_PYTHON.resolve()
    except OSError:
        return False


def main():
    """Run administrative tasks."""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixmitra.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    if not _running_under_venv():
        os.chdir(BACKEND_DIR)
        os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])
    main()
