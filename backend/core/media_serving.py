"""Secure serving of user-uploaded media from MEDIA_ROOT (production-safe)."""

from __future__ import annotations

import mimetypes
from pathlib import Path

from django.conf import settings
from django.http import FileResponse, Http404, HttpResponseNotModified
from django.utils.http import http_date, parse_http_date
from django.views import View


def resolve_media_file(path: str) -> Path:
    """
    Resolve a relative media path under MEDIA_ROOT.
    Raises Http404 for traversal, absolute paths, or missing files.
    """
    if not path or path.startswith('/') or '\\' in path:
        raise Http404('Invalid media path')

    media_root = Path(settings.MEDIA_ROOT).resolve()
    relative = Path(path)
    if relative.is_absolute() or '..' in relative.parts:
        raise Http404('Invalid media path')

    full_path = (media_root / relative).resolve()
    if full_path != media_root and media_root not in full_path.parents:
        raise Http404('Invalid media path')
    if not full_path.is_file():
        raise Http404('Media not found')
    return full_path


class SecureMediaServeView(View):
    """Serve files from MEDIA_ROOT only — never arbitrary filesystem paths."""

    def get(self, request, path: str):
        full_path = resolve_media_file(path)
        stat = full_path.stat()

        if_modified_since = request.META.get('HTTP_IF_MODIFIED_SINCE')
        if if_modified_since:
            try:
                if int(stat.st_mtime) <= parse_http_date(if_modified_since):
                    return HttpResponseNotModified()
            except (ValueError, OverflowError, TypeError):
                pass

        content_type, _ = mimetypes.guess_type(str(full_path))
        response = FileResponse(full_path.open('rb'), content_type=content_type or 'application/octet-stream')
        response['Last-Modified'] = http_date(stat.st_mtime)
        response['Cache-Control'] = 'private, max-age=3600'
        return response
