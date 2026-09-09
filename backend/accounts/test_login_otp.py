from django.core import mail
from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

User = get_user_model()


@override_settings(
    EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend',
    OTP_RESEND_COOLDOWN_SECONDS=0,
    OTP_MAX_ATTEMPTS=5,
    OTP_MAX_RESENDS=999999,
    EMAIL_VERIFICATION_REQUIRED=False,
)
class LoginOTPTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.password = 'Demo@123'
        self.user = User.objects.create_user(
            'otpuser',
            email='otpuser@example.com',
            password=self.password,
            role='CUSTOMER',
            is_verified=True,
        )

    def _extract_otp(self):
        self.assertTrue(mail.outbox)
        body = mail.outbox[-1].body
        for token in body.split():
            if token.isdigit() and len(token) == 6:
                return token
        self.fail('OTP not found in email body')

    def test_login_otp_flow(self):
        send = self.client.post('/api/auth/login/send-otp/', {
            'username': 'otpuser',
            'password': self.password,
        })
        self.assertEqual(send.status_code, 200)
        self.assertTrue(send.data['success'])
        self.assertIn('login_challenge', send.data)
        self.assertTrue(send.data.get('email_masked'))

        otp = self._extract_otp()
        verify = self.client.post('/api/auth/login/verify-otp/', {
            'login_challenge': send.data['login_challenge'],
            'otp': otp,
        })
        self.assertEqual(verify.status_code, 200)
        self.assertIn('access', verify.data)
        self.assertEqual(verify.data['user']['username'], 'otpuser')

    def test_login_otp_wrong_password(self):
        resp = self.client.post('/api/auth/login/send-otp/', {
            'username': 'otpuser',
            'password': 'WrongPass!',
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn(resp.data['error'], ('invalid_credentials', 'invalid_password'))

    def test_login_otp_invalid_code(self):
        send = self.client.post('/api/auth/login/send-otp/', {
            'username': self.user.email,
            'password': self.password,
        })
        self.assertEqual(send.status_code, 200)
        verify = self.client.post('/api/auth/login/verify-otp/', {
            'login_challenge': send.data['login_challenge'],
            'otp': '000000',
        })
        self.assertEqual(verify.status_code, 400)
        self.assertEqual(verify.data['error'], 'invalid_otp')
