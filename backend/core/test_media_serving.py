import tempfile
from pathlib import Path

from django.http import Http404
from django.test import TestCase, override_settings
from django.urls import reverse

from core.media_serving import resolve_media_file


class MediaPathResolutionTests(TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.media_root = Path(self.temp_dir.name)
        (self.media_root / 'profiles').mkdir()
        (self.media_root / 'profiles' / 'user.jpg').write_bytes(b'fake-image')

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_serves_existing_file(self):
        with self.settings(MEDIA_ROOT=self.media_root):
            resolved = resolve_media_file('profiles/user.jpg')
            self.assertEqual(resolved.read_bytes(), b'fake-image')

    def test_rejects_path_traversal(self):
        with self.settings(MEDIA_ROOT=self.media_root):
            with self.assertRaises(Http404):
                resolve_media_file('../settings.py')

    def test_rejects_missing_file(self):
        with self.settings(MEDIA_ROOT=self.media_root):
            with self.assertRaises(Http404):
                resolve_media_file('profiles/missing.jpg')


class SecureMediaServeViewTests(TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.media_root = Path(self.temp_dir.name)
        (self.media_root / 'profiles').mkdir()
        (self.media_root / 'profiles' / 'avatar.png').write_bytes(
            b'\x89PNG\r\n\x1a\n',
        )

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_media_url_serves_file_when_debug_false(self):
        with self.settings(
            MEDIA_ROOT=self.media_root,
            MEDIA_URL='/media/',
            SERVE_MEDIA_FROM_DISK=True,
            DEBUG=False,
        ):
            response = self.client.get('/media/profiles/avatar.png')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response['Content-Type'], 'image/png')
            content = b''.join(response.streaming_content)
            response.close()
            self.assertIn(b'\x89PNG', content)

    def test_media_url_404_for_traversal(self):
        with self.settings(
            MEDIA_ROOT=self.media_root,
            MEDIA_URL='/media/',
            SERVE_MEDIA_FROM_DISK=True,
            DEBUG=False,
        ):
            response = self.client.get('/media/profiles/../../etc/passwd')
            self.assertEqual(response.status_code, 404)

    def test_media_url_404_for_missing(self):
        with self.settings(
            MEDIA_ROOT=self.media_root,
            MEDIA_URL='/media/',
            SERVE_MEDIA_FROM_DISK=True,
            DEBUG=False,
        ):
            response = self.client.get('/media/profiles/does-not-exist.png')
            self.assertEqual(response.status_code, 404)

    def test_media_route_registered(self):
        with self.settings(
            MEDIA_ROOT=self.media_root,
            MEDIA_URL='/media/',
            SERVE_MEDIA_FROM_DISK=True,
        ):
            url = reverse('media', kwargs={'path': 'profiles/avatar.png'})
            self.assertEqual(url, '/media/profiles/avatar.png')
