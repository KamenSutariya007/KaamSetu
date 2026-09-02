from unittest.mock import patch

from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from django.contrib.auth import get_user_model

User = get_user_model()

VALID_PASSWORD = 'SecurePass1!'

FIREBASE_SETTINGS = {
    'FIREBASE_PROJECT_ID': 'test-project',
    'FIREBASE_CREDENTIALS_JSON': '{"type":"service_account","project_id":"test"}',
    'EMAIL_VERIFICATION_REQUIRED': False,
}

MOCK_IDENTITY = {
    'uid': 'firebase-uid-123',
    'email': 'firebase@example.com',
    'email_verified': True,
    'first_name': 'Fire',
    'last_name': 'Base',
    'picture': '',
}

BASE_PAYLOAD = {
    'email': 'firebase@example.com',
    'first_name': 'Fire',
    'last_name': 'Base',
    'phone': '9876543210',
    'city': 'Ahmedabad',
    'state': 'Gujarat',
    'pin_code': '380015',
    'role': 'CUSTOMER',
    'terms_accepted': True,
    'id_token': 'fake-firebase-token',
}


@override_settings(**FIREBASE_SETTINGS)
class FirebaseAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    @patch('accounts.firebase_auth.verify_firebase_id_token')
    def test_firebase_login_existing_user(self, mock_verify):
        mock_verify.return_value = MOCK_IDENTITY
        user = User.objects.create_user(
            'firebaseuser', email='firebase@example.com', password='unused',
            phone='9876543210', role='CUSTOMER', is_verified=True,
            firebase_uid='firebase-uid-123',
        )
        user.set_unusable_password()
        user.save()
        resp = self.client.post('/api/auth/firebase/', {'id_token': 'fake-firebase-token'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertEqual(resp.data['user']['email'], user.email)

    @patch('accounts.firebase_auth.verify_firebase_id_token')
    def test_firebase_login_not_registered(self, mock_verify):
        mock_verify.return_value = MOCK_IDENTITY
        resp = self.client.post('/api/auth/firebase/', {'id_token': 'fake-firebase-token'})
        self.assertEqual(resp.status_code, 404)
        self.assertEqual(resp.data['code'], 'not_registered')

    @patch('accounts.firebase_auth.verify_firebase_id_token')
    def test_firebase_login_unverified_email(self, mock_verify):
        mock_verify.return_value = {**MOCK_IDENTITY, 'email_verified': False}
        resp = self.client.post('/api/auth/firebase/', {'id_token': 'fake-firebase-token'})
        self.assertEqual(resp.status_code, 400)
        self.assertEqual(resp.data['code'], 'email_not_verified')

    @patch('accounts.firebase_auth.verify_firebase_id_token')
    def test_firebase_register_success(self, mock_verify):
        mock_verify.return_value = MOCK_IDENTITY
        resp = self.client.post('/api/auth/firebase/register/', BASE_PAYLOAD)
        self.assertEqual(resp.status_code, 201)
        self.assertIn('access', resp.data)
        user = User.objects.get(email='firebase@example.com')
        self.assertEqual(user.firebase_uid, 'firebase-uid-123')
        self.assertTrue(user.is_verified)

    @patch('accounts.firebase_auth.verify_firebase_id_token')
    def test_firebase_register_email_mismatch(self, mock_verify):
        mock_verify.return_value = MOCK_IDENTITY
        payload = {**BASE_PAYLOAD, 'email': 'other@example.com'}
        resp = self.client.post('/api/auth/firebase/register/', payload)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('email', resp.data)

    def test_firebase_not_configured(self):
        with self.settings(FIREBASE_CREDENTIALS_JSON='', FIREBASE_CREDENTIALS_PATH=''):
            resp = self.client.post('/api/auth/firebase/', {'id_token': 'token'})
            self.assertEqual(resp.status_code, 503)
