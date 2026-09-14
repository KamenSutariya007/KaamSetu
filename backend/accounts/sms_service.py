"""Mobile number verification and SMS OTP service."""

import logging
import os
import re
import secrets
import json
import urllib.request
import urllib.error
import urllib.parse
import base64
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from .models import PhoneVerification

logger = logging.getLogger(__name__)


def normalize_phone(phone: str) -> str:
    """Normalize phone to 10 digits for India (e.g. 9876543210)."""
    digits = re.sub(r'\D', '', phone or '')
    if len(digits) == 12 and digits.startswith('91'):
        digits = digits[2:]
    elif len(digits) == 11 and digits.startswith('0'):
        digits = digits[1:]
    return digits


def mask_phone(phone: str) -> str:
    norm = normalize_phone(phone)
    if len(norm) == 10:
        return f"{norm[:2]}******{norm[-2:]}"
    return phone


def generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _otp_expiry_minutes() -> int:
    return int(getattr(settings, 'PHONE_OTP_EXPIRY_MINUTES', 10))


def _resend_cooldown_seconds() -> int:
    return max(0, int(getattr(settings, 'PHONE_OTP_RESEND_COOLDOWN_SECONDS', 60)))


def _send_fast2sms(phone: str, otp: str, api_key: str) -> bool:
    """Send real SMS via Fast2SMS free/paid API in India."""
    api_key = api_key.strip()
    # Route 1: OTP route via POST JSON
    try:
        url = "https://www.fast2sms.com/dev/bulkV2"
        payload = json.dumps({
            "variables_values": str(otp),
            "route": "otp",
            "numbers": str(phone),
        }).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=payload,
            headers={
                "authorization": api_key,
                "Content-Type": "application/json",
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            logger.info("Fast2SMS OTP route response: %s", data)
            if data.get('return'):
                return True
    except Exception as exc:
        logger.warning("Fast2SMS OTP route error: %s", exc)

    # Route 2: Quick SMS route via GET fallback
    try:
        msg = urllib.parse.quote(f"Your KaamSetu OTP verification code is {otp}. Valid for 10 minutes.")
        url = f"https://www.fast2sms.com/dev/bulkV2?authorization={api_key}&route=q&message={msg}&language=english&flash=0&numbers={phone}"
        req = urllib.request.Request(url, headers={"User-Agent": "KaamSetu/1.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            logger.info("Fast2SMS Quick SMS response: %s", data)
            if data.get('return'):
                return True
    except Exception as exc:
        logger.warning("Fast2SMS Quick route error: %s", exc)

    return False


def _send_2factor(phone: str, otp: str, api_key: str) -> bool:
    """Send real SMS via 2Factor.in API in India."""
    try:
        api_key = api_key.strip()
        url = f"https://2factor.in/v1/API/V1/{api_key}/SMS/+91{phone}/{otp}/KaamSetu"
        req = urllib.request.Request(url, headers={"User-Agent": "KaamSetu/1.0"})
        with urllib.request.urlopen(req, timeout=12) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            logger.info("2Factor API response: %s", data)
            return data.get('Status') == 'Success'
    except Exception as exc:
        logger.warning("2Factor SMS error: %s", exc)
        return False


def _send_twilio(phone: str, otp: str, account_sid: str, auth_token: str, from_number: str) -> bool:
    """Send real SMS via Twilio API."""
    try:
        url = f"https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json"
        data = urllib.parse.urlencode({
            'To': f'+91{phone}',
            'From': from_number,
            'Body': f'Your KaamSetu verification code is: {otp}. Valid for 10 minutes.',
        }).encode('utf-8')
        auth_bytes = f"{account_sid}:{auth_token}".encode('utf-8')
        auth_header = "Basic " + base64.b64encode(auth_bytes).decode('ascii')
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                'Authorization': auth_header,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method='POST',
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            res_data = json.loads(resp.read().decode('utf-8'))
            logger.info("Twilio response SID: %s", res_data.get('sid'))
            return bool(res_data.get('sid'))
    except Exception as exc:
        logger.warning("Twilio SMS error: %s", exc)
        return False


def send_mobile_otp(phone_input: str) -> dict:
    """
    Generate and send real 6-digit OTP SMS to mobile number.
    Uses Fast2SMS, 2Factor, or Twilio configured in .env.
    """
    phone = normalize_phone(phone_input)
    if len(phone) != 10:
        return {
            'success': False,
            'error': 'invalid_phone',
            'message': 'Please enter a valid 10-digit mobile number.',
        }

    # Cooldown check
    now = timezone.now()
    cooldown = _resend_cooldown_seconds()
    last_record = (
        PhoneVerification.objects.filter(phone=phone)
        .order_by('-created_at')
        .first()
    )
    if last_record and last_record.last_sent_at and cooldown > 0:
        elapsed = (now - last_record.last_sent_at).total_seconds()
        if elapsed < cooldown and last_record.verified_at is None:
            return {
                'success': False,
                'error': 'resend_cooldown',
                'message': 'Please wait before requesting another OTP.',
                'retry_after_seconds': max(1, int(cooldown - elapsed)),
            }

    otp = generate_otp()
    otp_hash = make_password(otp)
    expires_at = now + timedelta(minutes=_otp_expiry_minutes())

    record = PhoneVerification.objects.create(
        phone=phone,
        otp_hash=otp_hash,
        expires_at=expires_at,
        last_sent_at=now,
    )

    fast2sms_key = os.getenv('FAST2SMS_API_KEY', '').strip()
    twofactor_key = os.getenv('TWOFACTOR_API_KEY', '').strip()
    twilio_sid = os.getenv('TWILIO_ACCOUNT_SID', '').strip()
    twilio_token = os.getenv('TWILIO_AUTH_TOKEN', '').strip()
    twilio_from = os.getenv('TWILIO_PHONE_NUMBER', '').strip()

    sms_sent = False
    provider_name = None

    if fast2sms_key:
        sms_sent = _send_fast2sms(phone, otp, fast2sms_key)
        if sms_sent:
            provider_name = 'Fast2SMS'
    if not sms_sent and twofactor_key:
        sms_sent = _send_2factor(phone, otp, twofactor_key)
        if sms_sent:
            provider_name = '2Factor'
    if not sms_sent and twilio_sid and twilio_token and twilio_from:
        sms_sent = _send_twilio(phone, otp, twilio_sid, twilio_token, twilio_from)
        if sms_sent:
            provider_name = 'Twilio'

    # Always log to server console for admin reference
    logger.info("[MOBILE OTP] Dispatched code for +91 %s via %s (Success: %s)", phone, provider_name or 'None', sms_sent)
    print(f"\n[MOBILE OTP LOG] Dispatched code for +91 {phone} via {provider_name or 'None'}: {otp} (Success: {sms_sent})\n")

    if not fast2sms_key and not twofactor_key and not twilio_sid:
        return {
            'success': False,
            'error': 'gateway_not_configured',
            'message': 'SMS Gateway setup baaki chhe. Real Mobile SMS mate Fast2SMS API Key add karo: run karo `.\\scripts\\set-sms-api-key.ps1`.',
        }

    if not sms_sent:
        return {
            'success': False,
            'error': 'sms_dispatch_failed',
            'message': 'Mobile par SMS moklva ma nishfalta mali. Krupaya SMS Gateway API Key ane credits check karo.',
        }

    return {
        'success': True,
        'message': f'OTP sent via SMS to +91 {mask_phone(phone)}. Tamara mobile par SMS check karo.',
        'phone_masked': mask_phone(phone),
        'retry_after_seconds': cooldown,
        'sms_dispatched': True,
    }


def verify_mobile_otp(phone_input: str, otp_input: str) -> dict:
    """Verify submitted 6-digit OTP code for phone."""
    phone = normalize_phone(phone_input)
    otp = (otp_input or '').strip()

    if len(phone) != 10:
        return {'success': False, 'message': 'Invalid phone number.'}
    if len(otp) != 6 or not otp.isdigit():
        return {'success': False, 'message': 'Please enter a valid 6-digit OTP code.'}

    record = (
        PhoneVerification.objects.filter(
            phone=phone,
            verified_at__isnull=True,
            expires_at__gt=timezone.now(),
        )
        .order_by('-created_at')
        .first()
    )

    if not record:
        return {'success': False, 'message': 'OTP expired or not found. Please request a new code.'}

    if record.attempt_count >= 5:
        return {'success': False, 'message': 'Too many incorrect attempts. Please request a new OTP.'}

    record.attempt_count += 1
    if not check_password(otp, record.otp_hash):
        record.save()
        return {'success': False, 'message': 'Incorrect OTP code. Please try again.'}

    token = secrets.token_urlsafe(32)
    record.verified_at = timezone.now()
    record.verification_token = token
    record.save()

    return {
        'success': True,
        'message': 'Mobile number verified successfully!',
        'verification_token': token,
    }


def consume_phone_verification_token(phone_input: str, token: str) -> bool:
    """Validate that phone was verified with token."""
    phone = normalize_phone(phone_input)
    if not phone or not token:
        return False

    record = (
        PhoneVerification.objects.filter(
            phone=phone,
            verification_token=token,
            verified_at__isnull=False,
        )
        .order_by('-created_at')
        .first()
    )
    return record is not None
