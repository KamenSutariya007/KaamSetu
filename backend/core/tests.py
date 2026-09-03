from django.test import TestCase, override_settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from datetime import date, time, timedelta
from django.utils import timezone

from services.models import ServiceCategory
from providers.models import ServiceProvider, ProviderAvailability
from bookings.models import Booking
from bookings.scheduling import is_slot_available, hold_slot, find_available_slots
from ai_diagnosis.services import analyze_issue

User = get_user_model()


class AuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_and_login(self):
        email = 'test@test.com'
        resp = self.client.post('/api/auth/register/', {
            'email': email,
            'password': 'TestPass123!', 'password_confirm': 'TestPass123!',
            'first_name': 'Test', 'last_name': 'User', 'phone': '9123456789',
            'city': 'Ahmedabad', 'state': 'Gujarat', 'pin_code': '380001',
            'role': 'CUSTOMER', 'terms_accepted': True,
        })
        self.assertEqual(resp.status_code, 201)
        self.assertIn('access', resp.data)
        username = resp.data['user']['username']
        resp = self.client.post('/api/auth/login/', {'username': username, 'password': 'TestPass123!'})
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)


class AuthorizationTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user('cust', password='TestPass123!', role='CUSTOMER', is_verified=True)
        self.provider_user = User.objects.create_user('prov', password='TestPass123!', role='INDIVIDUAL_PROVIDER', is_verified=True)
        self.client = APIClient()

    def test_customer_cannot_access_admin(self):
        self.client.force_authenticate(self.customer)
        resp = self.client.get('/api/admin/dashboard/')
        self.assertEqual(resp.status_code, 403)


class AISafetyTests(TestCase):
    def test_dangerous_gas_leak(self):
        result = analyze_issue(text='I smell gas leakage in kitchen', language='en')
        self.assertTrue(result['is_dangerous'])
        self.assertEqual(result['decision'], 'Call Professional')

    def test_safe_plumbing(self):
        result = analyze_issue(text='My tap is leaking slightly', category_hint='plumbing')
        self.assertFalse(result['is_dangerous'])


class SchedulingTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user('cust2', password='TestPass123!', role='CUSTOMER')
        prov_user = User.objects.create_user('prov2', password='TestPass123!', role='INDIVIDUAL_PROVIDER')
        self.category = ServiceCategory.objects.create(name='Plumbing', slug='plumbing-test')
        self.provider = ServiceProvider.objects.create(user=prov_user, visit_charge=150, verification_status='verified')
        self.provider.categories.add(self.category)
        for day in range(5):
            ProviderAvailability.objects.create(
                provider=self.provider, day_of_week=day,
                start_time=time(8, 0), end_time=time(20, 0),
            )

    def test_double_booking_prevention(self):
        tomorrow = timezone.now().date() + timedelta(days=1)
        start = timezone.make_aware(timezone.datetime.combine(tomorrow, time(10, 0)))
        end = start + timedelta(hours=2)

        slot1 = hold_slot(self.provider, start, end)
        self.assertIsNotNone(slot1)

        slot2 = hold_slot(self.provider, start, end)
        self.assertIsNone(slot2)

    def test_find_available_slots(self):
        tomorrow = timezone.now().date() + timedelta(days=1)
        slots = find_available_slots(self.provider, tomorrow, time(10, 0), time(12, 0))
        self.assertTrue(len(slots) > 0)


class BookingTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user('cust3', password='TestPass123!', role='CUSTOMER')
        prov_user = User.objects.create_user('prov3', password='TestPass123!', role='INDIVIDUAL_PROVIDER')
        self.category = ServiceCategory.objects.create(name='Electrical', slug='electrical-test')
        self.provider = ServiceProvider.objects.create(user=prov_user)
        self.client = APIClient()
        self.client.force_authenticate(self.customer)

    def test_create_booking(self):
        resp = self.client.post('/api/bookings/', {
            'category': self.category.id,
            'provider': self.provider.id,
            'issue_description': 'Switch not working',
            'address': 'Ahmedabad',
            'latitude': '23.0225',
            'longitude': '72.5714',
            'preferred_date': str(date.today() + timedelta(days=2)),
        })
        self.assertEqual(resp.status_code, 201)


class OTPAndInvoiceTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user('cust4', password='TestPass123!', role='CUSTOMER')
        prov_user = User.objects.create_user('prov4', password='TestPass123!', role='INDIVIDUAL_PROVIDER')
        self.provider = ServiceProvider.objects.create(user=prov_user, visit_charge=200)
        self.category = ServiceCategory.objects.create(name='Plumbing', slug='plumb-otp')
        self.booking = Booking.objects.create(
            customer=self.customer, provider=self.provider, category=self.category,
            issue_description='Leak', address='Ahmedabad', status='started',
            visit_charge=200, completion_otp='654321',
        )
        self.client = APIClient()
        self.client.force_authenticate(prov_user)

    def test_complete_requires_otp(self):
        resp = self.client.post(f'/api/bookings/{self.booking.id}/complete/', {'otp': '000000'})
        self.assertEqual(resp.status_code, 400)
        resp = self.client.post(f'/api/bookings/{self.booking.id}/complete/', {'otp': '654321'})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'completed')


class TechnicianConflictTests(TestCase):
    def setUp(self):
        from providers.models import ThirdPartyPartner, PartnerTechnician, TechnicianAvailability
        partner_user = User.objects.create_user('part1', password='TestPass123!', role='THIRD_PARTY_PARTNER')
        self.partner = ThirdPartyPartner.objects.create(user=partner_user, organization_name='Test Partner', partner_type='repair_company')
        self.tech = PartnerTechnician.objects.create(partner=self.partner, name='Tech A')
        for day in range(5):
            TechnicianAvailability.objects.create(technician=self.tech, day_of_week=day, start_time=time(8, 0), end_time=time(20, 0))

    def test_technician_double_booking(self):
        from bookings.scheduling import hold_technician_slot
        tomorrow = timezone.now().date() + timedelta(days=1)
        start = timezone.make_aware(timezone.datetime.combine(tomorrow, time(11, 0)))
        end = start + timedelta(hours=2)
        s1 = hold_technician_slot(self.tech, start, end)
        self.assertIsNotNone(s1)
        s2 = hold_technician_slot(self.tech, start, end)
        self.assertIsNone(s2)


class SupportEscalationTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user('cust6', password='TestPass123!', role='CUSTOMER')
        self.client = APIClient()
        self.client.force_authenticate(self.customer)

    def test_safety_ticket_escalates(self):
        resp = self.client.post('/api/support/tickets/', {
            'category': 'safety', 'subject': 'Gas smell', 'description': 'Strong gas leakage smell in kitchen',
        })
        self.assertEqual(resp.status_code, 201)


class RejectSlotTests(TestCase):
    def setUp(self):
        self.customer = User.objects.create_user('cust7', password='TestPass123!', role='CUSTOMER')
        prov_user = User.objects.create_user('prov7', password='TestPass123!', role='INDIVIDUAL_PROVIDER')
        self.provider = ServiceProvider.objects.create(user=prov_user)
        self.category = ServiceCategory.objects.create(name='Door', slug='door-rej')
        self.booking = Booking.objects.create(
            customer=self.customer, provider=self.provider, category=self.category,
            issue_description='Lock', address='Ahmedabad', status='requested', slot_status='slot_held',
        )
        self.client = APIClient()
        self.client.force_authenticate(prov_user)

    def test_reject_slot(self):
        resp = self.client.post(f'/api/bookings/{self.booking.id}/reject-slot/', {})
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['status'], 'rejected')


@override_settings(EMAIL_VERIFICATION_REQUIRED=True)
class SeedDemoLoginTests(TestCase):
    """Demo seed must mark accounts verified so Render login works with verification on."""

    def setUp(self):
        self.client = APIClient()

    def test_seed_marks_demo_users_verified_and_login_returns_jwt(self):
        from django.core.management import call_command

        call_command('seed_demo_data')
        user = User.objects.get(username='customer1')
        self.assertTrue(user.is_verified)

        resp = self.client.post('/api/auth/login/', {
            'username': 'customer1',
            'password': 'Demo@123',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
        self.assertIn('refresh', resp.data)
        self.assertTrue(resp.data['user']['is_verified'])

    def test_seed_is_idempotent_and_repairs_unverified_demo_users(self):
        from django.core.management import call_command

        call_command('seed_demo_data')
        first_count = User.objects.filter(username='customer1').count()
        self.assertEqual(first_count, 1)

        user = User.objects.get(username='customer1')
        user.is_verified = False
        user.save(update_fields=['is_verified'])

        call_command('seed_demo_data')
        self.assertEqual(User.objects.filter(username='customer1').count(), 1)
        user.refresh_from_db()
        self.assertTrue(user.is_verified)

        resp = self.client.post('/api/auth/login/', {
            'username': 'customer1',
            'password': 'Demo@123',
        })
        self.assertEqual(resp.status_code, 200)
        self.assertIn('access', resp.data)
