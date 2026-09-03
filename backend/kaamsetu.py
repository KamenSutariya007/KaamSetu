#!/usr/bin/env python
"""
KaamSetu backend starter — run from backend folder:
    python kaamsetu.py

Always uses backend\\venv when present (avoids system Python missing daphne).
Server: http://localhost:8000
"""
import os
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent
VENV_PYTHON = BACKEND_DIR / 'venv' / 'Scripts' / 'python.exe'


def _running_under_venv() -> bool:
    if not VENV_PYTHON.exists():
        return True
    try:
        return Path(sys.executable).resolve() == VENV_PYTHON.resolve()
    except OSError:
        return False


if __name__ == '__main__' and not _running_under_venv():
    os.chdir(BACKEND_DIR)
    os.execv(str(VENV_PYTHON), [str(VENV_PYTHON), str(Path(__file__).resolve()), *sys.argv[1:]])


# Project root .env (same as Django settings)
env_file = PROJECT_ROOT / '.env'
if env_file.exists():
    try:
        from dotenv import load_dotenv
        load_dotenv(env_file)
    except ImportError:
        pass

os.chdir(BACKEND_DIR)
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'fixmitra.settings')

if __name__ == '__main__':
    port = os.environ.get('BACKEND_PORT', '8000')
    bind = os.environ.get('BACKEND_BIND', '0.0.0.0')
    try:
        from core.network import get_lan_ip, get_public_frontend_url, read_tunnel_url
        lan = get_lan_ip()
        public_fe = get_public_frontend_url()
        tunnel = read_tunnel_url()
    except ImportError:
        lan = None
        public_fe = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        tunnel = None

    fe_port = os.environ.get('FRONTEND_PORT', '5173')

    print(f'KaamSetu backend: http://127.0.0.1:{port}')
    if tunnel:
        print(f'  WiFi + mobile data:   {tunnel}')
    if lan:
        print(f'  Same WiFi only:       http://{lan}:{fe_port}')
    print(f'  Email reset links:    {public_fe}')
    print(f'  Python:               {sys.executable}')
    print('Stop with Ctrl+C\n')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise SystemExit(
            'Django not found in backend\\venv.\n'
            '  .\\venv\\Scripts\\python.exe -m pip install -r requirements.txt'
        ) from exc
    execute_from_command_line(['kaamsetu.py', 'runserver', f'{bind}:{port}'])
