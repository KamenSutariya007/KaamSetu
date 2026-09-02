"""Google OAuth token verification."""

import logging

from django.conf import settings

logger = logging.getLogger(__name__)


def verify_google_id_token(token: str) -> dict | None:
    client_id = getattr(settings, 'GOOGLE_OAUTH_CLIENT_ID', '')
    if not client_id:
        return None
    try:
        from google.auth.transport import requests as google_requests
        from google.oauth2 import id_token
        idinfo = id_token.verify_oauth2_token(
            token,
            google_requests.Request(),
            client_id,
        )
    except Exception:
        logger.warning('Google token verification failed', exc_info=True)
        return None

    if idinfo.get('iss') not in ('accounts.google.com', 'https://accounts.google.com'):
        return None
    if not idinfo.get('email_verified'):
        return None
    if not idinfo.get('email'):
        return None

    return {
        'email': idinfo['email'].lower(),
        'google_id': idinfo.get('sub', ''),
        'first_name': idinfo.get('given_name', ''),
        'last_name': idinfo.get('family_name', ''),
        'picture': idinfo.get('picture', ''),
    }
