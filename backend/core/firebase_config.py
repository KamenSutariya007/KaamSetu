"""Firebase project alignment helpers (no secrets logged or returned)."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def get_service_account_project_id(
    credentials_path: str = '',
    credentials_json: str = '',
) -> str | None:
    """Read project_id from Admin SDK credentials without exposing private keys."""
    try:
        data: dict[str, Any] | None = None
        path = (credentials_path or '').strip()
        raw_json = (credentials_json or '').strip()
        if path and Path(path).is_file():
            data = json.loads(Path(path).read_text(encoding='utf-8'))
        elif raw_json:
            data = json.loads(raw_json)
        if not isinstance(data, dict):
            return None
        project_id = (data.get('project_id') or '').strip()
        return project_id or None
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        return None


def validate_firebase_project_alignment(
    configured_project_id: str = '',
    credentials_path: str = '',
    credentials_json: str = '',
) -> list[str]:
    """
    Ensure FIREBASE_PROJECT_ID matches the service account project_id.
    Returns human-readable error messages (safe to show in manage.py check).
    """
    service_project_id = get_service_account_project_id(credentials_path, credentials_json)
    if not service_project_id:
        return []

    configured = (configured_project_id or '').strip()
    if not configured:
        return [
            'FIREBASE_PROJECT_ID is not set but Firebase Admin credentials are configured. '
            f'Set FIREBASE_PROJECT_ID={service_project_id} to match your service account.',
        ]
    if configured != service_project_id:
        return [
            'Firebase project mismatch: FIREBASE_PROJECT_ID '
            f'({configured}) does not match the service account project_id '
            f'({service_project_id}). Frontend VITE_FIREBASE_PROJECT_ID must use the same project.',
        ]
    return []
