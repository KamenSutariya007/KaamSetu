from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

User = get_user_model()

VALID_PASSWORD = 'SecurePass1!'

EMAIL_TEST_SETTINGS = {
    'EMAIL_BACKEND': 'django.core.mail.backends.locmem.EmailBackend',
    'DEFAULT_FROM_EMAIL': 'test@fixmitra.com',
    'EMAIL_HOST': 'smtp.test.com',
    'OTP_RESEND_COOLDOWN_SECONDS': 0,
    'EMAIL_VERIFICATION_REQUIRED': False,
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


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = 'TestPass123!'
        self.user = User.objects.create_user(
            'loginuser', email='login@example.com', password=self.password,
            phone='9123456780', role='CUSTOMER', is_verified=True,
        )

    def test_login_with_username(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'loginuser', 'password': self.password,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertEqual(resp.data['user']['role'], 'CUSTOMER')

    def test_login_with_email(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'login@example.com', 'password': self.password,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)

    def test_login_with_phone(self):
        resp = self.client.post('/api/auth/login/', {
            'username': '9123456780', 'password': self.password,
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)

    def test_login_invalid_credentials(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'loginuser', 'password': 'WrongPass1!',
        })
        self.assertEqual(resp.status_code, 401)

    def test_login_inactive_account(self):
        self.user.is_active = False
        self.user.save()
        resp = self.client.post('/api/auth/login/', {
            'username': 'loginuser', 'password': self.password,
        })
        self.assertEqual(resp.status_code, 401)


@override_settings(**EMAIL_TEST_SETTINGS)
class RegistrationValidationTests(TestCase):
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

    def test_customer_registration_success(self):
        resp = self.client.post('/api/auth/register/', self.base_payload)
        self.assertEqual(resp.status_code, 201)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertEqual(resp.data['user']['role'], 'CUSTOMER')

    def test_duplicate_email_rejected(self):
        User.objects.create_user('existing', email='newuser@example.com', password=VALID_PASSWORD, is_verified=True)
        resp = self.client.post('/api/auth/register/', self.base_payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('email', resp.data)

    def test_duplicate_phone_rejected(self):
        User.objects.create_user('existing', email='other@example.com', password=VALID_PASSWORD, phone='9876543210', is_verified=True)
        resp = self.client.post('/api/auth/register/', self.base_payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('phone', resp.data)

    def test_invalid_phone_rejected(self):
        payload = {**self.base_payload, 'phone': '12345'}
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('phone', resp.data)

    def test_invalid_pin_rejected(self):
        payload = {**self.base_payload, 'pin_code': '123'}
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('pin_code', resp.data)

    def test_password_mismatch_rejected(self):
        payload = {**self.base_payload, 'password_confirm': 'WrongPass1!'}
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('password_confirm', resp.data)

    def test_weak_password_rejected(self):
        payload = {**self.base_payload, 'password': 'weak', 'password_confirm': 'weak'}
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('password', resp.data)

    def test_terms_unchecked_rejected(self):
        payload = {**self.base_payload, 'terms_accepted': False}
        resp = self.client.post('/api/auth/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('terms_accepted', resp.data)

    def test_admin_role_registration_rejected(self):
        resp = self.client.post('/api/auth/register/', {**self.base_payload, 'role': 'ADMIN'})
        self.assertEqual(resp.status_code, 400)

    def test_support_role_registration_rejected(self):
        resp = self.client.post('/api/auth/register/', {**self.base_payload, 'role': 'SUPPORT_AGENT'})
        self.assertEqual(resp.status_code, 400)

    def test_provider_registration_with_profile(self):
        email = 'provider@example.com'
        payload = {
            **self.base_payload,
            'email': email,
            'phone': '9876543211',
            'role': 'INDIVIDUAL_PROVIDER',
            'provider_profile': {
                'experience_years': 5,
                'visit_charge': '250.00',
                'service_radius_km': '12.00',
                'bio': 'Experienced plumber',
                'working_days': [0, 1, 2, 3, 4],
                'work_start': '09:00',
                'work_end': '18:00',
            },
        }
        resp = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['user']['role'], 'INDIVIDUAL_PROVIDER')

    def test_partner_registration_with_profile(self):
        email = 'partner@example.com'
        payload = {
            **self.base_payload,
            'email': email,
            'phone': '9876543212',
            'role': 'THIRD_PARTY_PARTNER',
            'partner_profile': {
                'organization_name': 'FixPro Services',
                'partner_type': 'repair_company',
                'authorized_brands': ['Samsung'],
                'business_address': 'Satellite, Ahmedabad',
                'gst_number': '24AAAAA0000A1Z5',
                'contact_person': 'Ravi Patel',
            },
        }
        resp = self.client.post('/api/auth/register/', payload, format='json')
        self.assertEqual(resp.status_code, 201)
        self.assertEqual(resp.data['user']['role'], 'THIRD_PARTY_PARTNER')


class JWTRefreshRotationTests(TestCase):
    """SimpleJWT ROTATE_REFRESH_TOKENS=True returns a new refresh each time."""

    def setUp(self):
        self.client = APIClient()
        self.password = 'TestPass123!'
        self.user = User.objects.create_user(
            'jwuser', email='jwt@example.com', password=self.password,
            phone='9123456799', role='CUSTOMER', is_verified=True,
        )

    def _login(self):
        resp = self.client.post('/api/auth/login/', {
            'username': 'jwuser', 'password': self.password,
        })
        self.assertEqual(resp.status_code, 200)
        return resp.data

    def test_refresh_returns_new_access_and_rotated_refresh(self):
        tokens = self._login()
        old_refresh = tokens['refresh']
        resp = self.client.post('/api/auth/refresh/', {'refresh': old_refresh})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertNotEqual(resp.data['access'], tokens['access'])
        self.assertNotEqual(resp.data['refresh'], old_refresh)

    def test_next_refresh_uses_rotated_refresh_token(self):
        tokens = self._login()
        first = self.client.post('/api/auth/refresh/', {'refresh': tokens['refresh']})
        self.assertEqual(first.status_code, 200)
        rotated = first.data['refresh']
        second = self.client.post('/api/auth/refresh/', {'refresh': rotated})
        self.assertEqual(second.status_code, 200)
        self.assertIn('access', second.data)
        self.assertIn('refresh', second.data)
        self.assertNotEqual(second.data['refresh'], rotated)

    def test_invalid_refresh_token_is_rejected(self):
        resp = self.client.post('/api/auth/refresh/', {'refresh': 'not-a-valid-token'})
        self.assertIn(resp.status_code, (400, 401))
        self.assertNotIn('access', resp.data)
