import json
import tempfile
from pathlib import Path

from django.core.checks import run_checks
from django.test import TestCase, override_settings

from core.firebase_config import (
    get_service_account_project_id,
    validate_firebase_project_alignment,
)


class FirebaseConfigValidationTests(TestCase):
    def test_reads_project_id_from_service_account_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'service-account.json'
            path.write_text(
                json.dumps({'type': 'service_account', 'project_id': 'kaamsetu-a51c6'}),
                encoding='utf-8',
            )
            self.assertEqual(get_service_account_project_id(str(path), ''), 'kaamsetu-a51c6')

    def test_reads_project_id_from_json_env(self):
        payload = json.dumps({'type': 'service_account', 'project_id': 'kaamsetu-a51c6'})
        self.assertEqual(get_service_account_project_id('', payload), 'kaamsetu-a51c6')

    def test_aligned_project_passes(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'service-account.json'
            path.write_text(
                json.dumps({'type': 'service_account', 'project_id': 'kaamsetu-a51c6'}),
                encoding='utf-8',
            )
            errors = validate_firebase_project_alignment('kaamsetu-a51c6', str(path), '')
            self.assertEqual(errors, [])

    def test_mismatched_project_fails(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'service-account.json'
            path.write_text(
                json.dumps({'type': 'service_account', 'project_id': 'kaamsetu-a51c6'}),
                encoding='utf-8',
            )
            errors = validate_firebase_project_alignment('kaamsetu-ef0d3', str(path), '')
            self.assertEqual(len(errors), 1)
            self.assertIn('mismatch', errors[0])

    def test_missing_configured_project_warns(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'service-account.json'
            path.write_text(
                json.dumps({'type': 'service_account', 'project_id': 'kaamsetu-a51c6'}),
                encoding='utf-8',
            )
            errors = validate_firebase_project_alignment('', str(path), '')
            self.assertEqual(len(errors), 1)
            self.assertIn('FIREBASE_PROJECT_ID is not set', errors[0])

    def test_django_check_reports_mismatch(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / 'service-account.json'
            path.write_text(
                json.dumps({'type': 'service_account', 'project_id': 'kaamsetu-a51c6'}),
                encoding='utf-8',
            )
            with self.settings(
                FIREBASE_PROJECT_ID='kaamsetu-ef0d3',
                FIREBASE_CREDENTIALS_PATH=str(path),
                FIREBASE_CREDENTIALS_JSON='',
            ):
                issues = run_checks()
                messages = ' '.join(str(issue.msg) for issue in issues)
                self.assertIn('Firebase project mismatch', messages)

    @override_settings(
        FIREBASE_PROJECT_ID='kaamsetu-ef0d3',
        FIREBASE_CREDENTIALS_PATH='',
        FIREBASE_CREDENTIALS_JSON='',
    )
    def test_django_check_skips_when_firebase_not_configured(self):
        issues = run_checks()
        messages = ' '.join(str(issue.msg) for issue in issues)
        self.assertNotIn('Firebase project mismatch', messages)
