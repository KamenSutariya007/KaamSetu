import re
from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

from accounts.email_service import send_email_otp, verify_email_otp, normalize_email

User = get_user_model()

VALID_PASSWORD = 'SecurePass1!'

EMAIL_SETTINGS = {
    'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend',
    'DEFAULT_FROM_EMAIL': 'test@fixmitra.com',
    'EMAIL_HOST': 'smtp.test.com',
    'OTP_RESEND_COOLDOWN_SECONDS': 0,
    'OTP_MAX_ATTEMPTS': 5,
    'OTP_MAX_RESENDS': 999999,
    'REST_FRAMEWORK': {
        'DEFAULT_AUTHENTICATION_CLASSES': [
            'rest_framework_simplejwt.authentication.JWTAuthentication',
        ],
        'DEFAULT_PERMISSION_CLASSES': [
            'rest_framework.permissions.IsAuthenticated',
        ],
        'DEFAULT_THROTTLE_RATES': {
            'send_otp': '1000/min',
            'verify_otp': '1000/min',
            'register': '1000/min',
            'google_auth': '1000/min',
        },
    },
}


def extract_otp_from_mail():
    body = mail.outbox[-1].body
    match = re.search(r'\b(\d{6})\b', body)
    return match.group(1) if match else None


def verify_email_for_tests(client, email):
    from django.core import mail
    mail.outbox.clear()
    send_resp = client.post('/api/auth/email/send-otp/', {'email': email})
    assert send_resp.status_code == 200, send_resp.data
    otp = extract_otp_from_mail()
    verify_resp = client.post('/api/auth/email/verify-otp/', {'email': email, 'otp': otp})
    return send_resp, verify_resp


@override_settings(**EMAIL_SETTINGS)
class EmailVerificationServiceTests(TestCase):
    def test_normalize_email(self):
        self.assertEqual(normalize_email('Test@Gmail.COM'), 'test@gmail.com')

    def test_invalid_email_format(self):
        result = send_email_otp('not-an-email')
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'invalid_email')

    @override_settings(
        EMAIL_HOST='',
        DEFAULT_FROM_EMAIL='',
        EMAIL_BACKEND='django.core.mail.backends.smtp.EmailBackend',
        EMAIL_VERIFICATION_DEV_MODE=False,
    )
    def test_not_configured_without_email_host(self):
        result = send_email_otp('user@example.com')
        self.assertFalse(result['success'])
        self.assertEqual(result['error'], 'not_configured')


@override_settings(**EMAIL_SETTINGS)
class EmailVerificationAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.email = 'verify@example.com'
        mail.outbox.clear()

    def test_send_otp_success(self):
        resp = self.client.post('/api/auth/email/send-otp/', {'email': self.email})
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.data['success'])
        self.assertEqual(len(mail.outbox), 1)

    def test_verify_valid_otp(self):
        self.client.post('/api/auth/email/send-otp/', {'email': self.email})
        otp = extract_otp_from_mail()
        resp = self.client.post('/api/auth/email/verify-otp/', {'email': self.email, 'otp': otp})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('verification_token', resp.data)

    def test_verify_invalid_otp(self):
        self.client.post('/api/auth/email/send-otp/', {'email': self.email})
        resp = self.client.post('/api/auth/email/verify-otp/', {'email': self.email, 'otp': '000000'})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['error'], 'invalid_otp')

    def test_otp_cannot_be_reused(self):
        self.client.post('/api/auth/email/send-otp/', {'email': self.email})
        otp = extract_otp_from_mail()
        first = self.client.post('/api/auth/email/verify-otp/', {'email': self.email, 'otp': otp})
        token = first.data['verification_token']
        second = self.client.post('/api/auth/email/verify-otp/', {'email': self.email, 'otp': otp})
        self.assertEqual(second.status_code, 400)

        payload = {
            'email': self.email,
            'password': VALID_PASSWORD,
            'password_confirm': VALID_PASSWORD,
            'first_name': 'Test',
            'last_name': 'User',
            'phone': '9876543210',
            'city': 'Ahmedabad',
            'state': 'Gujarat',
            'pin_code': '380015',
            'role': 'CUSTOMER',
            'terms_accepted': True,
            'verification_token': token,
        }
        reg = self.client.post('/api/auth/register/', payload)
        self.assertEqual(reg.status_code, 201)
        reg2 = self.client.post('/api/auth/register/', {**payload, 'phone': '9876543211'})
        self.assertEqual(reg2.status_code, 400)

    def test_max_attempts(self):
        self.client.post('/api/auth/email/send-otp/', {'email': self.email})
        for _ in range(5):
            resp = self.client.post('/api/auth/email/verify-otp/', {'email': self.email, 'otp': '111111'})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['error'], 'too_many_attempts')

    def test_case_insensitive_email(self):
        self.client.post('/api/auth/email/send-otp/', {'email': 'Verify@Example.COM'})
        otp = extract_otp_from_mail()
        resp = self.client.post('/api/auth/email/verify-otp/', {'email': 'verify@example.com', 'otp': otp})
        self.assertEqual(resp.status_code, 200)


@override_settings(**{**EMAIL_SETTINGS, 'EMAIL_VERIFICATION_REQUIRED': True})
class RegistrationSecurityTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.base_payload = {
            'email': 'newuser@example.com',
            'password': VALID_PASSWORD,
            'password_confirm': VALID_PASSWORD,
            'first_name': 'Ravi',
            'last_name': 'Patel',
            'phone': '9876543210',
            'city': 'Ahmedabad',
            'state': 'Gujarat',
            'pin_code': '380015',
            'role': 'CUSTOMER',
            'terms_accepted': True,
        }

    def test_registration_without_verification_rejected(self):
        before = User.objects.count()
        resp = self.client.post('/api/auth/register/', self.base_payload)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(User.objects.count(), before)
        self.assertTrue('email' in resp.data or 'verification_token' in resp.data)

    def test_registration_with_verification_succeeds(self):
        before = User.objects.count()
        _, verify_resp = verify_email_for_tests(self.client, self.base_payload['email'])
        payload = {**self.base_payload, 'verification_token': verify_resp.data['verification_token']}
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(User.objects.count(), before + 1)
        user = User.objects.get(email='newuser@example.com')
        self.assertTrue(user.is_verified)

    def test_verification_token_email_mismatch(self):
        _, verify_resp = verify_email_for_tests(self.client, self.base_payload['email'])
        payload = {
            **self.base_payload,
            'email': 'other@example.com',
            'verification_token': verify_resp.data['verification_token'],
        }
        self.client.post('/api/auth/email/send-otp/', {'email': 'other@example.com'})
        before = User.objects.count()
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(User.objects.count(), before)

    def test_frontend_bypass_email_verified_flag_ignored(self):
        _, verify_resp = verify_email_for_tests(self.client, self.base_payload['email'])
        payload = {
            **self.base_payload,
            'verification_token': verify_resp.data['verification_token'],
            'email_verified': True,
            'is_verified': True,
        }
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 201)

    def test_duplicate_email_on_send_otp(self):
        User.objects.create_user('existing', email='newuser@example.com', password=VALID_PASSWORD, is_verified=True)
        resp = self.client.post('/api/auth/email/send-otp/', {'email': 'newuser@example.com'})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['error'], 'duplicate_email')


@override_settings(**EMAIL_SETTINGS)
class GoogleAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('accounts.views.verify_google_id_token')
    def test_google_auth_creates_verified_user(self, mock_verify):
        mock_verify.return_value = {
            'email': 'google@example.com',
            'google_id': 'gid123',
            'first_name': 'Google',
            'last_name': 'User',
        }
        resp = self.client.post('/api/auth/google/', {'id_token': 'fake-token', 'role': 'CUSTOMER'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        user = User.objects.get(email='google@example.com')
        self.assertTrue(user.is_verified)

    @patch('accounts.views.verify_google_id_token')
    def test_invalid_google_token_rejected(self, mock_verify):
        mock_verify.return_value = None
        resp = self.client.post('/api/auth/google/', {'id_token': 'bad-token'})
        self.assertEqual(resp.status_code, 400)

    @patch('accounts.views.verify_google_id_token')
    def test_admin_role_rejected_for_google(self, mock_verify):
        mock_verify.return_value = {
            'email': 'admin@example.com',
            'google_id': 'gid999',
            'first_name': 'Admin',
            'last_name': 'Try',
        }
        resp = self.client.post('/api/auth/google/', {'id_token': 'fake-token', 'role': 'ADMIN'})
        self.assertEqual(resp.status_code, 400)


@override_settings(**{**EMAIL_SETTINGS, 'EMAIL_VERIFICATION_REQUIRED': True})
class LoginVerificationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = VALID_PASSWORD
        self.user = User.objects.create_user(
            'unverified', email='unverified@example.com', password=self.password,
            phone='9123456789', role='CUSTOMER', is_verified=False,
        )

    def test_unverified_user_cannot_login(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'unverified@example.com', 'password': self.password,
        })
        self.assertIn(resp.status_code, (400, 401))
        self.assertIn('verify', str(resp.data).lower())

    def test_verified_user_can_login(self):
        self.user.is_verified = True
        self.user.save()
        resp = self.client.post('/api/auth/login/', {
            'username': 'unverified@example.com', 'password': self.password,
        })
        self.assertEqual(resp.status_code, 200)
