"""Firebase Authentication token verification."""

import json
import logging

from django.conf import settings

from core.firebase_config import validate_firebase_project_alignment

logger = logging.getLogger(__name__)

_firebase_app = None


def firebase_configured() -> bool:
    if getattr(settings, 'FIREBASE_CREDENTIALS_PATH', ''):
        return True
    if getattr(settings, 'FIREBASE_CREDENTIALS_JSON', ''):
        return True
    return False


def _get_firebase_app():
    global _firebase_app
    if _firebase_app is not None:
        return _firebase_app
    if not firebase_configured():
        return None
    try:
        import firebase_admin
        from firebase_admin import credentials

        if firebase_admin._apps:
            _firebase_app = firebase_admin.get_app()
            return _firebase_app

        cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '')
        cred_json = getattr(settings, 'FIREBASE_CREDENTIALS_JSON', '')
        configured_project = getattr(settings, 'FIREBASE_PROJECT_ID', '')
        alignment_errors = validate_firebase_project_alignment(
            configured_project, cred_path, cred_json,
        )
        if alignment_errors:
            logger.error('Firebase Admin SDK not initialized: %s', alignment_errors[0])
            return None
        if cred_path:
            cred = credentials.Certificate(cred_path)
        elif cred_json:
            cred = credentials.Certificate(json.loads(cred_json))
        else:
            return None
        options = {}
        if configured_project:
            options['projectId'] = configured_project
        _firebase_app = firebase_admin.initialize_app(cred, options or None)
        return _firebase_app
    except Exception:
        logger.warning('Firebase initialization failed', exc_info=True)
        return None


def verify_firebase_id_token(token: str) -> dict | None:
    if not token or not firebase_configured():
        return None
    if _get_firebase_app() is None:
        return None
    try:
        from firebase_admin import auth

        decoded = auth.verify_id_token(token, check_revoked=False)
    except Exception:
        logger.warning('Firebase token verification failed', exc_info=True)
        return None

    email = (decoded.get('email') or '').lower()
    if not email:
        return None

    name = decoded.get('name') or ''
    parts = name.split(' ', 1) if name else ['', '']
    return {
        'uid': decoded.get('uid', ''),
        'email': email,
        'email_verified': bool(decoded.get('email_verified')),
        'first_name': decoded.get('given_name') or parts[0],
        'last_name': decoded.get('family_name') or (parts[1] if len(parts) > 1 else ''),
        'picture': decoded.get('picture', ''),
    }
