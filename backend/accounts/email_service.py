"""Email verification and registration token utilities."""

import logging
import os
import re
import secrets
from datetime import timedelta

from django.conf import settings
from django.contrib.auth.hashers import check_password, make_password
from django.core.mail import send_mail
from django.utils import timezone

from .models import EmailVerification, LoginChallenge, RegistrationVerificationToken, User

logger = logging.getLogger(__name__)

EMAIL_RE = re.compile(r'^[^@\s]+@[^@\s]+\.[^@\s]+$')


def normalize_email(email: str) -> str:
    return (email or '').strip().lower()


def is_valid_email_format(email: str) -> bool:
    return bool(EMAIL_RE.match(normalize_email(email)))


def mask_email(email: str) -> str:
    email = normalize_email(email)
    local, _, domain = email.partition('@')
    if not domain:
        return '***'
    if len(local) <= 2:
        masked_local = f'{local[:1]}***'
    else:
        masked_local = f'{local[:2]}***'
    return f'{masked_local}@{domain}'


def _otp_dev_expose() -> bool:
    """Only local/dev may return OTP in API responses (never production DEMO_MODE)."""
    return bool(getattr(settings, 'EMAIL_VERIFICATION_DEV_MODE', False))


def email_service_configured() -> bool:
    if getattr(settings, 'RESEND_API_KEY', '') or os.getenv('RESEND_API_KEY', ''):
        return True
    if _otp_dev_expose():
        return True
    backend = getattr(settings, 'EMAIL_BACKEND', '')
    if backend.endswith('console.EmailBackend') or backend.endswith('locmem.EmailBackend'):
        return True
    host = getattr(settings, 'EMAIL_HOST', '')
    from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', '')
    return bool(host and from_email)


def generate_otp() -> str:
    return f'{secrets.randbelow(1_000_000):06d}'


def hash_otp(otp: str) -> str:
    return make_password(otp)


def verify_otp(otp: str, otp_hash: str) -> bool:
    return check_password(otp, otp_hash)


def _otp_expiry_minutes() -> int:
    return int(getattr(settings, 'OTP_EXPIRY_MINUTES', 10))


def _max_attempts() -> int:
    value = int(getattr(settings, 'OTP_MAX_ATTEMPTS', 5))
    return value if value > 0 else 999_999


def _resend_cooldown_seconds() -> int:
    return max(0, int(getattr(settings, 'OTP_RESEND_COOLDOWN_SECONDS', 60)))


def _max_resends() -> int:
    value = int(getattr(settings, 'OTP_MAX_RESENDS', 5))
    return value if value > 0 else 999_999


def _verification_token_minutes() -> int:
    return int(getattr(settings, 'REGISTRATION_VERIFICATION_TOKEN_MINUTES', 30))


def _dispatch_email(email: str, subject: str, message: str) -> None:
    resend_api_key = (getattr(settings, 'RESEND_API_KEY', '') or os.getenv('RESEND_API_KEY', '')).strip()
    if resend_api_key:
        try:
            import json
            import urllib.request
            sender = getattr(settings, 'DEFAULT_FROM_EMAIL', '') or 'KaamSetu <onboarding@resend.dev>'
            if '@' not in sender or 'localhost' in sender or 'fixmitra.local' in sender:
                sender = 'KaamSetu <onboarding@resend.dev>'
            payload = json.dumps({
                'from': sender,
                'to': [email],
                'subject': subject,
                'text': message,
            }).encode('utf-8')
            req = urllib.request.Request(
                'https://api.resend.com/emails',
                data=payload,
                headers={
                    'Authorization': f'Bearer {resend_api_key}',
                    'Content-Type': 'application/json',
                    'User-Agent': 'KaamSetu/1.0',
                },
            )
            with urllib.request.urlopen(req, timeout=10) as resp:
                if resp.status in (200, 201):
                    logger.info('Email successfully dispatched to %s via Resend HTTPS API', email)
                    return
        except Exception as e:
            logger.warning('Resend HTTPS email failed (%s), attempting fallback to standard email backend', e)

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [email],
        fail_silently=False,
    )


def send_verification_email(email: str, otp: str, *, purpose: str = EmailVerification.Purpose.REGISTRATION) -> None:
    if purpose == EmailVerification.Purpose.LOGIN:
        subject = f'KaamSetu Login OTP: {otp}'
        message = (
            'Hello,\n\n'
            f'Your KaamSetu login OTP is: {otp}\n\n'
            f'This code expires in {_otp_expiry_minutes()} minutes.\n\n'
            'If you did not try to sign in, please secure your account.\n\n'
            'Regards,\nKaamSetu Team'
        )
    elif purpose == EmailVerification.Purpose.PASSWORD_RESET:
        subject = f'KaamSetu Password Reset OTP: {otp}'
        message = (
            'Hello,\n\n'
            f'Your password reset OTP is: {otp}\n\n'
            f'This code expires in {_otp_expiry_minutes()} minutes.\n\n'
            'Enter this code on the forgot-password page to set a new password.\n\n'
            'If you did not request a password reset, you can safely ignore this email.\n\n'
            'Regards,\nKaamSetu Team'
        )
    else:
        subject = f'KaamSetu Email OTP: {otp}'
        message = (
            'Hello,\n\n'
            f'Your KaamSetu verification OTP is: {otp}\n\n'
            f'This code expires in {_otp_expiry_minutes()} minutes.\n\n'
            'If you did not request this verification, you can safely ignore this email.\n\n'
            'Regards,\nKaamSetu Team'
        )
    _dispatch_email(email, subject, message)


def get_active_verification(email: str, purpose: str = EmailVerification.Purpose.REGISTRATION):
    email = normalize_email(email)
    return (
        EmailVerification.objects.filter(
            email=email,
            purpose=purpose,
            verified_at__isnull=True,
            expires_at__gt=timezone.now(),
        )
        .order_by('-created_at')
        .first()
    )


def _create_and_send_otp(email: str, purpose: str) -> dict:
    email = normalize_email(email)
    if not email_service_configured():
        return {
            'success': False,
            'error': 'not_configured',
            'message': 'Email verification service is not configured.',
        }

    active = get_active_verification(email, purpose)
    cooldown = _resend_cooldown_seconds()
    if cooldown > 0 and active and active.last_sent_at:
        elapsed = (timezone.now() - active.last_sent_at).total_seconds()
        if elapsed < cooldown:
            return {
                'success': False,
                'error': 'resend_cooldown',
                'message': 'Please wait before requesting another code.',
                'retry_after_seconds': max(1, int(cooldown - elapsed)),
            }

    max_resends = _max_resends()
    if max_resends < 999_999:
        window_start = timezone.now() - timedelta(hours=1)
        recent_count = EmailVerification.objects.filter(
            email=email,
            purpose=purpose,
            created_at__gte=window_start,
        ).count()
        if recent_count >= max_resends:
            return {
                'success': False,
                'error': 'rate_limited',
                'message': 'Too many verification requests. Please try again later.',
            }

    otp = generate_otp()
    now = timezone.now()
    EmailVerification.objects.filter(
        email=email,
        purpose=purpose,
        verified_at__isnull=True,
    ).update(expires_at=now)

    record = EmailVerification.objects.create(
        email=email,
        purpose=purpose,
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(minutes=_otp_expiry_minutes()),
        last_sent_at=now,
        resend_count=(active.resend_count + 1) if active else 1,
    )

    try:
        send_verification_email(email, otp, purpose=purpose)
    except Exception as e:
        if _otp_dev_expose():
            logger.warning('Email send failed in DEV mode (%s). Exposing OTP for local testing.', e)
            return {
                'success': True,
                'message': f'Dev Mode: Verification OTP is {otp}',
                'retry_after_seconds': cooldown,
                'email_masked': mask_email(email),
                'demo_otp': otp,
            }
        logger.exception('Failed to send %s email to %s', purpose, email)
        record.delete()
        return {
            'success': False,
            'error': 'send_failed',
            'message': 'Unable to send verification email. Please try again later.',
        }

    payload = {
        'success': True,
        'message': 'Verification code sent. Check your email inbox.',
        'retry_after_seconds': cooldown,
        'email_masked': mask_email(email),
    }
    # Never put OTP in JSON for production — only explicit local DEV flag.
    if _otp_dev_expose():
        logger.info('OTP for %s (%s): %s', email, purpose, otp)
        payload['demo_otp'] = otp
        payload['message'] = f'Dev Mode: Verification OTP is {otp}'
    return payload


def send_email_otp(email: str) -> dict:
    email = normalize_email(email)
    if not is_valid_email_format(email):
        return {'success': False, 'error': 'invalid_email', 'message': 'Please enter a valid email address.'}

    if User.objects.filter(email__iexact=email).exists():
        return {'success': False, 'error': 'duplicate_email', 'message': 'This email address is already registered.'}

    return _create_and_send_otp(email, EmailVerification.Purpose.REGISTRATION)


def verify_email_otp(email: str, otp: str) -> dict:
    email = normalize_email(email)
    otp = (otp or '').strip()

    if not is_valid_email_format(email):
        return {'success': False, 'error': 'invalid_email', 'message': 'Please enter a valid email address.'}

    if not re.fullmatch(r'\d{6}', otp):
        return {'success': False, 'error': 'invalid_otp', 'message': 'Incorrect verification code.'}

    record = get_active_verification(email, EmailVerification.Purpose.REGISTRATION)
    if not record:
        return {
            'success': False,
            'error': 'expired',
            'message': 'This verification code has expired. Please request a new code.',
        }

    if record.attempt_count >= _max_attempts():
        record.expires_at = timezone.now()
        record.save(update_fields=['expires_at', 'updated_at'])
        return {
            'success': False,
            'error': 'too_many_attempts',
            'message': 'Too many incorrect attempts. Please request a new code.',
        }

    if not verify_otp(otp, record.otp_hash):
        record.attempt_count += 1
        record.save(update_fields=['attempt_count', 'updated_at'])
        if record.attempt_count >= _max_attempts():
            record.expires_at = timezone.now()
            record.save(update_fields=['expires_at', 'updated_at'])
            return {
                'success': False,
                'error': 'too_many_attempts',
                'message': 'Too many incorrect attempts. Please request a new code.',
            }
        return {'success': False, 'error': 'invalid_otp', 'message': 'Incorrect verification code.'}

    now = timezone.now()
    record.verified_at = now
    record.save(update_fields=['verified_at', 'updated_at'])

    RegistrationVerificationToken.objects.filter(email=email, used_at__isnull=True).update(used_at=now)

    token = secrets.token_urlsafe(32)
    RegistrationVerificationToken.objects.create(
        email=email,
        token=token,
        expires_at=now + timedelta(minutes=_verification_token_minutes()),
    )

    return {
        'success': True,
        'message': 'Email verified.',
        'verification_token': token,
    }


def consume_registration_token(email: str, token: str) -> bool:
    email = normalize_email(email)
    token = (token or '').strip()
    if not token:
        return False

    now = timezone.now()
    record = RegistrationVerificationToken.objects.filter(
        email=email,
        token=token,
        used_at__isnull=True,
        expires_at__gt=now,
    ).first()

    if not record:
        return False

    record.used_at = now
    record.save(update_fields=['used_at'])
    return True


def invalidate_verification_for_email(email: str) -> None:
    email = normalize_email(email)
    now = timezone.now()
    EmailVerification.objects.filter(email=email, verified_at__isnull=True).update(expires_at=now)
    RegistrationVerificationToken.objects.filter(email=email, used_at__isnull=True).update(used_at=now)


def send_password_reset_otp(email: str, link_base: str | None = None) -> dict:
    """Send OTP for forgot-password. Optionally include reset link in the same email."""
    email = normalize_email(email)
    generic_ok = {
        'success': True,
        'message': 'If the email exists, a verification code and reset link have been sent.',
        'retry_after_seconds': _resend_cooldown_seconds(),
    }

    if not is_valid_email_format(email):
        return {'success': False, 'error': 'invalid_email', 'message': 'Please enter a valid email address.'}

    if not email_service_configured():
        return {
            'success': False,
            'error': 'not_configured',
            'message': 'Email service is not configured.',
        }

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return generic_ok

    active = get_active_verification(email, EmailVerification.Purpose.PASSWORD_RESET)
    cooldown = _resend_cooldown_seconds()
    if cooldown > 0 and active and active.last_sent_at:
        elapsed = (timezone.now() - active.last_sent_at).total_seconds()
        if elapsed < cooldown:
            return {
                'success': False,
                'error': 'resend_cooldown',
                'message': 'Please wait before requesting another code.',
                'retry_after_seconds': max(1, int(cooldown - elapsed)),
            }

    otp = generate_otp()
    now = timezone.now()
    EmailVerification.objects.filter(
        email=email,
        purpose=EmailVerification.Purpose.PASSWORD_RESET,
        verified_at__isnull=True,
    ).update(expires_at=now)

    record = EmailVerification.objects.create(
        email=email,
        purpose=EmailVerification.Purpose.PASSWORD_RESET,
        otp_hash=hash_otp(otp),
        expires_at=now + timedelta(minutes=_otp_expiry_minutes()),
        last_sent_at=now,
        resend_count=(active.resend_count + 1) if active else 1,
    )

    reset_token = secrets.token_urlsafe(32)
    from .models import PasswordResetToken
    PasswordResetToken.objects.create(
        user=user,
        token=reset_token,
        expires_at=now + timedelta(hours=24),
    )

    reset_url = None
    if link_base:
        from core.network import is_localhost_url
        base = link_base.rstrip('/')
        if not is_localhost_url(base):
            reset_url = f'{base}/reset-password?token={reset_token}'

    subject = f'KaamSetu Password Reset OTP: {otp}'
    message = (
        'Hello,\n\n'
        f'Your password reset OTP is: {otp}\n\n'
        f'This code expires in {_otp_expiry_minutes()} minutes.\n'
        'Enter it on the KaamSetu forgot-password page to set a new password.\n\n'
    )
    if reset_url:
        message += f'Or open this link to reset directly:\n{reset_url}\n\n'
    message += (
        'If you did not request this, ignore this email.\n\n'
        'Regards,\nKaamSetu Team'
    )

    try:
        _dispatch_email(email, subject, message)
    except Exception:
        logger.exception('Failed to send password reset email to %s', email)
        record.delete()
        PasswordResetToken.objects.filter(token=reset_token).delete()
        return {
            'success': False,
            'error': 'send_failed',
            'message': 'Unable to send email. Please try again later.',
        }

    payload = {
        'success': True,
        'message': generic_ok['message'],
        'retry_after_seconds': cooldown,
        'email_masked': mask_email(email),
        'reset_token': reset_token,
    }
    if reset_url:
        payload['dev_reset_url'] = reset_url
    return payload


def verify_password_reset_otp(email: str, otp: str) -> dict:
    email = normalize_email(email)
    otp = (otp or '').strip()

    if not is_valid_email_format(email):
        return {'success': False, 'error': 'invalid_email', 'message': 'Please enter a valid email address.'}

    if not re.fullmatch(r'\d{6}', otp):
        return {'success': False, 'error': 'invalid_otp', 'message': 'Incorrect verification code.'}

    record = get_active_verification(email, EmailVerification.Purpose.PASSWORD_RESET)
    if not record:
        return {
            'success': False,
            'error': 'expired',
            'message': 'This verification code has expired. Please request a new code.',
        }

    if record.attempt_count >= _max_attempts():
        record.expires_at = timezone.now()
        record.save(update_fields=['expires_at', 'updated_at'])
        return {
            'success': False,
            'error': 'too_many_attempts',
            'message': 'Too many incorrect attempts. Please request a new code.',
        }

    if not verify_otp(otp, record.otp_hash):
        record.attempt_count += 1
        record.save(update_fields=['attempt_count', 'updated_at'])
        return {'success': False, 'error': 'invalid_otp', 'message': 'Incorrect verification code.'}

    now = timezone.now()
    record.verified_at = now
    record.save(update_fields=['verified_at', 'updated_at'])

    user = User.objects.filter(email__iexact=email).first()
    if not user:
        return {'success': False, 'error': 'not_found', 'message': 'Account not found.'}

    from .models import PasswordResetToken
    reset_record = (
        PasswordResetToken.objects.filter(user=user, used=False, expires_at__gt=now)
        .order_by('-created_at')
        .first()
    )
    if not reset_record:
        return {
            'success': False,
            'error': 'expired',
            'message': 'Reset session expired. Please request a new code.',
        }

    return {
        'success': True,
        'message': 'Code verified. Set your new password.',
        'reset_token': reset_record.token,
    }


def send_login_otp(user: User) -> dict:
    email = normalize_email(user.email)
    if not email or not is_valid_email_format(email):
        return {
            'success': False,
            'error': 'no_email',
            'message': 'This account has no email address for OTP login.',
        }

    result = _create_and_send_otp(email, EmailVerification.Purpose.LOGIN)
    if not result.get('success'):
        return result

    now = timezone.now()
    LoginChallenge.objects.filter(user=user, used_at__isnull=True).update(used_at=now)
    challenge_token = secrets.token_urlsafe(32)
    LoginChallenge.objects.create(
        user=user,
        token=challenge_token,
        expires_at=now + timedelta(minutes=_otp_expiry_minutes()),
    )

    result['login_challenge'] = challenge_token
    return result


def _check_login_otp(email: str, otp: str) -> dict:
    email = normalize_email(email)
    otp = (otp or '').strip()

    if not re.fullmatch(r'\d{6}', otp):
        return {'success': False, 'error': 'invalid_otp', 'message': 'Incorrect verification code.'}

    record = get_active_verification(email, EmailVerification.Purpose.LOGIN)
    if not record:
        return {
            'success': False,
            'error': 'expired',
            'message': 'This verification code has expired. Please request a new code.',
        }

    if record.attempt_count >= _max_attempts():
        record.expires_at = timezone.now()
        record.save(update_fields=['expires_at', 'updated_at'])
        return {
            'success': False,
            'error': 'too_many_attempts',
            'message': 'Too many incorrect attempts. Please request a new code.',
        }

    if not verify_otp(otp, record.otp_hash):
        record.attempt_count += 1
        record.save(update_fields=['attempt_count', 'updated_at'])
        if record.attempt_count >= _max_attempts():
            record.expires_at = timezone.now()
            record.save(update_fields=['expires_at', 'updated_at'])
            return {
                'success': False,
                'error': 'too_many_attempts',
                'message': 'Too many incorrect attempts. Please request a new code.',
            }
        return {'success': False, 'error': 'invalid_otp', 'message': 'Incorrect verification code.'}

    now = timezone.now()
    record.verified_at = now
    record.save(update_fields=['verified_at', 'updated_at'])
    return {'success': True, 'record': record}


def verify_login_otp(login_challenge: str, otp: str) -> dict:
    token = (login_challenge or '').strip()
    if not token:
        return {'success': False, 'error': 'invalid_challenge', 'message': 'Login session expired. Please sign in again.'}

    challenge = LoginChallenge.objects.select_related('user').filter(
        token=token,
        used_at__isnull=True,
        expires_at__gt=timezone.now(),
    ).first()
    if not challenge:
        return {
            'success': False,
            'error': 'invalid_challenge',
            'message': 'Login session expired. Please sign in again.',
        }

    user = challenge.user
    if not user.is_active:
        return {
            'success': False,
            'error': 'inactive',
            'message': 'This account is inactive. Please contact support.',
        }

    otp_result = _check_login_otp(user.email, otp)
    if not otp_result.get('success'):
        return otp_result

    now = timezone.now()
    challenge.used_at = now
    challenge.save(update_fields=['used_at'])

    return {
        'success': True,
        'message': 'Login verified.',
        'user': user,
    }
