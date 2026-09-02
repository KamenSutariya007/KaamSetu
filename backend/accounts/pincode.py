"""India PIN code lookup via PostalPincode API."""

import logging
import re
import time

import requests
from django.core.cache import cache
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

PIN_RE = re.compile(r'^\d{6}$')
STATE_ALIASES = {
    'NCT of Delhi': 'Delhi',
    'Delhi': 'Delhi',
    'Orissa': 'Odisha',
    'Pondicherry': 'Puducherry',
    'Andaman & Nicobar Islands': 'Andaman and Nicobar Islands',
    'Dadra & Nagar Haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'Daman & Diu': 'Dadra and Nagar Haveli and Daman and Diu',
}

LOOKUP_URLS = (
    'https://api.postalpincode.in/pincode/{pin}',
    'http://www.postalpincode.in/api/pincode/{pin}',
)
REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; KaamSetu/1.0)',
    'Accept': 'application/json',
}


def normalize_state(name: str) -> str:
    name = (name or '').strip()
    return STATE_ALIASES.get(name, name)


def _parse_postal_payload(payload) -> dict | None:
    if isinstance(payload, list):
        entry = payload[0] if payload else None
    elif isinstance(payload, dict):
        entry = payload
    else:
        entry = None
    if not entry:
        return None
    if str(entry.get('Status', '')).lower() != 'success' or not entry.get('PostOffice'):
        return None
    office = entry['PostOffice'][0]
    district = (office.get('District') or '').strip()
    block = (office.get('Block') or '').strip()
    name = (office.get('Name') or '').strip()
    state = normalize_state(office.get('State') or '')
    city = district or block or name
    # Prefer post-office name as locality/area for address autofill
    area = name or block
    if area and city and area.lower() == city.lower() and block and block.lower() != city.lower():
        area = block
    return {
        'city': city,
        'state': state,
        'district': district,
        'area': area,
        'post_office': name,
    }


def lookup_pincode(pincode: str) -> dict:
    pincode = (pincode or '').strip()
    if not PIN_RE.fullmatch(pincode):
        return {'success': False, 'error': 'invalid_pincode', 'message': 'PIN code must be 6 digits.'}

    cache_key = f'pincode:v2:{pincode}'
    cached = cache.get(cache_key)
    if cached:
        return cached

    last_error = None
    for url_template in LOOKUP_URLS:
        url = url_template.format(pin=pincode)
        for attempt in range(2):
            try:
                resp = requests.get(url, headers=REQUEST_HEADERS, timeout=12)
                resp.raise_for_status()
                parsed = _parse_postal_payload(resp.json())
                if not parsed:
                    return {
                        'success': False,
                        'error': 'not_found',
                        'message': 'No location found for this PIN code.',
                    }
                result = {
                    'success': True,
                    'pincode': pincode,
                    **parsed,
                }
                cache.set(cache_key, result, 60 * 60 * 24)
                return result
            except Exception as exc:
                last_error = exc
                logger.warning('PIN lookup attempt failed (%s): %s', url, exc)
                time.sleep(0.4 * (attempt + 1))

    logger.exception('PIN code lookup failed for %s: %s', pincode, last_error)
    return {
        'success': False,
        'error': 'lookup_failed',
        'message': 'Unable to fetch city and state for this PIN code. Please enter them manually.',
    }


class PincodeLookupView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pincode):
        result = lookup_pincode(pincode)
        if not result.get('success'):
            code = status.HTTP_400_BAD_REQUEST
            if result.get('error') == 'lookup_failed':
                code = status.HTTP_503_SERVICE_UNAVAILABLE
            elif result.get('error') == 'not_found':
                code = status.HTTP_404_NOT_FOUND
            return Response(result, status=code)
        return Response(result)
