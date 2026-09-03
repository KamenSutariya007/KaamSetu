"""URL patterns for serving local media uploads."""

from django.conf import settings
from django.urls import re_path

from core.media_serving import SecureMediaServeView


def media_urlpatterns():
    """Expose /media/ when using on-disk MEDIA_ROOT (local dev + Render)."""
    if not getattr(settings, 'SERVE_MEDIA_FROM_DISK', True):
        return []
    media_url = (settings.MEDIA_URL or '/media/').lstrip('/').rstrip('/')
    if not media_url:
        return []
    return [
        re_path(
            rf'^{media_url}/(?P<path>.*)$',
            SecureMediaServeView.as_view(),
            name='media',
        ),
    ]
