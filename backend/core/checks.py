from django.conf import settings
from django.core.checks import Warning, register

from core.firebase_config import validate_firebase_project_alignment


@register()
def firebase_project_alignment_check(app_configs, **kwargs):
    cred_path = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '') or ''
    cred_json = getattr(settings, 'FIREBASE_CREDENTIALS_JSON', '') or ''
    configured = getattr(settings, 'FIREBASE_PROJECT_ID', '') or ''

    if not cred_path and not cred_json:
        return []

    issues = []
    for message in validate_firebase_project_alignment(configured, cred_path, cred_json):
        issues.append(
            Warning(
                message,
                hint=(
                    'Use one Firebase project for frontend (VITE_FIREBASE_*), backend '
                    '(FIREBASE_PROJECT_ID), and the Admin SDK service account JSON. '
                    'Copy web app config from Firebase Console → Project settings → Your apps.'
                ),
                id='core.W001',
            )
        )
    return issues
