"""Network helpers — public tunnel + LAN URLs for email reset links."""
import os
import socket
from pathlib import Path
from urllib.parse import urlparse

BACKEND_DIR = Path(__file__).resolve().parent.parent
PROJECT_ROOT = BACKEND_DIR.parent
TUNNEL_URL_FILE = PROJECT_ROOT / '.tunnel-url'


def get_lan_ip():
    """Return this machine's LAN IPv4 (e.g. 192.168.1.5), or None."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(('8.8.8.8', 80))
            return sock.getsockname()[0]
    except OSError:
        return None


def read_tunnel_url():
    """HTTPS URL from cloudflared tunnel (.tunnel-url) — works on WiFi + mobile data."""
    try:
        if TUNNEL_URL_FILE.exists():
            # utf-8-sig strips BOM written by PowerShell Set-Content
            url = TUNNEL_URL_FILE.read_text(encoding='utf-8-sig').strip()
            if url.startswith('http://') or url.startswith('https://'):
                return url.rstrip('/')
    except OSError:
        pass
    return None


def is_localhost_url(url):
    if not url:
        return True
    host = urlparse(url).hostname or ''
    return host in ('localhost', '127.0.0.1', '')


def get_email_reset_base_url():
    """
    URL for password-reset emails. Never returns localhost.
    Returns (url, error_message) — url is None if not usable on phone/mobile data.
    """
    base = get_public_frontend_url()
    if is_localhost_url(base):
        return None, (
            'Public link not ready. Start the tunnel first: .\\scripts\\tunnel.ps1 '
            '(or run .\\scripts\\run-dev.ps1), wait for the HTTPS URL, then try again.'
        )
    return base.rstrip('/'), None


def resolve_lan_frontend_url(frontend_url):
    """Replace localhost with LAN IP (same WiFi only)."""
    frontend_url = (frontend_url or 'http://localhost:5173').rstrip('/')
    parsed = urlparse(frontend_url)
    host = parsed.hostname or 'localhost'
    if host not in ('localhost', '127.0.0.1'):
        return frontend_url

    lan_ip = get_lan_ip()
    if not lan_ip:
        return frontend_url

    port = parsed.port or (443 if parsed.scheme == 'https' else 5173)
    scheme = parsed.scheme or 'http'
    return f'{scheme}://{lan_ip}:{port}'


def get_public_frontend_url():
    """
    Best URL for links in emails (password reset).
    Priority: PUBLIC_FRONTEND_URL → FRONTEND_URL (if not localhost) → tunnel → LAN IP.
    """
    explicit = os.getenv('PUBLIC_FRONTEND_URL', '').strip()
    if explicit:
        return explicit.rstrip('/')

    frontend = os.getenv('FRONTEND_URL', 'http://localhost:5173').rstrip('/')
    parsed = urlparse(frontend)
    if parsed.hostname not in ('localhost', '127.0.0.1'):
        return frontend

    tunnel = read_tunnel_url()
    if tunnel:
        return tunnel

    return resolve_lan_frontend_url(frontend)


# Backwards-compatible alias used in settings bootstrap
def resolve_public_frontend_url(explicit_url, frontend_url):
    if (explicit_url or '').strip():
        return explicit_url.strip().rstrip('/')
    tunnel = read_tunnel_url()
    if tunnel:
        return tunnel
    return resolve_lan_frontend_url(frontend_url)
