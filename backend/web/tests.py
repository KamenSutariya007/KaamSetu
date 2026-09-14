from decimal import Decimal
from django.test import TestCase, Client
from django.contrib.auth import get_user_model
from django.utils import timezone
from services.models import ServiceCategory, RepairGuide
from providers.models import ServiceProvider, ThirdPartyPartner
from bookings.models import Booking, BookingInvoice
from support.models import SupportTicket
from passport.models import HouseholdAsset

User = get_user_model()


class WebAppMigrationTests(TestCase):
    def setUp(self):
        self.client = Client()

        # Create Category
        self.category = ServiceCategory.objects.create(
            name='AC Repair & Service',
            slug='ac-repair',
            icon='air-vent',
            description='Expert AC servicing and cooling diagnostics',
            is_active=True
        )

        # Create Guide
        self.guide = RepairGuide.objects.create(
            category=self.category,
            title='How to Clean AC Filter',
            slug='clean-ac-filter',
            problem='AC cooling reduced due to dust accumulation on filter mesh',
            estimated_time='15 mins',
            difficulty='easy',
            steps=[
                {'title': 'Open Front Panel', 'description': 'Lift the plastic latch on both sides.'},
                {'title': 'Rinse Filter', 'description': 'Run under lukewarm water and let air dry.'}
            ],
            is_active=True
        )

        # Create Users for all roles
        self.customer = User.objects.create_user(
            username='test_customer',
            email='customer@example.com',
            password='testpassword123',
            first_name='Kavita',
            last_name='Patel',
            phone='9876543210',
            role='CUSTOMER',
            is_verified=True
        )

        self.provider_user = User.objects.create_user(
            username='test_provider',
            email='provider@example.com',
            password='testpassword123',
            first_name='Ramesh',
            last_name='Mistri',
            phone='9876543211',
            role='INDIVIDUAL_PROVIDER',
            is_verified=True
        )
        self.provider_profile = ServiceProvider.objects.create(
            user=self.provider_user,
            experience_years=5,
            visit_charge=199,
            verification_status='verified',
            trust_score=92
        )
        self.provider_profile.categories.add(self.category)

        self.partner_user = User.objects.create_user(
            username='test_partner',
            email='partner@example.com',
            password='testpassword123',
            first_name='Gujarat',
            last_name='Cooling Solutions',
            phone='9876543212',
            role='THIRD_PARTY_PARTNER',
            is_verified=True
        )
        self.partner_profile = ThirdPartyPartner.objects.create(
            user=self.partner_user,
            organization_name='Gujarat Cooling Solutions',
            partner_type='service_center',
            verification_status='verified'
        )

        self.agent_user = User.objects.create_user(
            username='test_agent',
            email='agent@example.com',
            password='testpassword123',
            first_name='Support',
            last_name='Agent',
            phone='9876543213',
            role='SUPPORT_AGENT',
            is_verified=True
        )

        self.admin_user = User.objects.create_user(
            username='test_admin',
            email='admin@example.com',
            password='testpassword123',
            first_name='Super',
            last_name='Admin',
            phone='9876543214',
            role='ADMIN',
            is_staff=True,
            is_superuser=True,
            is_verified=True
        )

        # Create Booking
        self.booking = Booking.objects.create(
            customer=self.customer,
            category=self.category,
            provider=self.provider_profile,
            issue_description='AC cooling gas low and not chilling',
            address='B-402, Satellite Road, Ahmedabad, Gujarat',
            latitude=Decimal('23.022500'),
            longitude=Decimal('72.571400'),
            preferred_date=timezone.now().date(),
            status='accepted',
            estimated_price_min=Decimal('300.00'),
            estimated_price_max=Decimal('600.00'),
            completion_otp='4829'
        )

        # Create Invoice
        self.invoice = BookingInvoice.objects.create(
            booking=self.booking,
            invoice_number='INV-TEST-001',
            visit_charge=Decimal('150.00'),
            labour_charge=Decimal('200.00'),
            material_charge=Decimal('100.00'),
            total_amount=Decimal('450.00')
        )

        # Create Household Asset
        self.asset = HouseholdAsset.objects.create(
            owner=self.customer,
            asset_type='ac',
            brand='Voltas',
            model_name='1.5 Ton Split Inverter',
            condition='good',
            purchase_date=timezone.now().date()
        )

        # Create Support Ticket
        self.ticket = SupportTicket.objects.create(
            ticket_number='TKT-TEST-01',
            customer=self.customer,
            category='booking',
            subject='Need reschedule for tomorrow morning',
            description='Can technician come at 11 AM instead of 10 AM?',
            status='open'
        )

    # ---------------------------------------------------------------------
    # Public Views Tests
    # ---------------------------------------------------------------------
    def test_landing_page(self):
        res = self.client.get('/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'KaamSetu')
        self.assertContains(res, 'AC Repair & Service')

    def test_ai_assistant_page(self):
        res = self.client.get('/ai-assistant/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'AI Diagnostic')

    def test_providers_page(self):
        res = self.client.get('/providers/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Ramesh Mistri')

    def test_guides_page(self):
        res = self.client.get('/guides/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'How to Clean AC Filter')

    def test_guide_detail_page(self):
        res = self.client.get('/guides/clean-ac-filter/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'How to Clean AC Filter')

    def test_fair_price_page(self):
        res = self.client.get('/fair-price/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Fair Price Estimator')

    def test_support_page(self):
        res = self.client.get('/support/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Support & Helpline')

    def test_language_switch(self):
        res = self.client.get('/switch-language/?lang=gu', follow=True)
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.client.session.get('kaamsetu_lang'), 'gu')

    def test_login_page(self):
        res = self.client.get('/login/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Sign in to KaamSetu')

    def test_register_page(self):
        res = self.client.get('/register/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Create your account')

    # ---------------------------------------------------------------------
    # Unauthenticated Protected Pages (Redirection to Login)
    # ---------------------------------------------------------------------
    def test_protected_pages_redirect_unauthenticated(self):
        protected_urls = [
            '/customer/',
            '/customer/bookings/',
            f'/customer/bookings/{self.booking.id}/',
            f'/customer/track/{self.booking.id}/',
            '/customer/passport/',
            '/customer/notifications/',
            '/customer/profile/',
            '/book/',
            '/provider/',
            '/partner/',
            '/support-desk/',
            '/admin-dashboard/',
            '/admin-panel/bookings/',
        ]
        for url in protected_urls:
            res = self.client.get(url)
            self.assertEqual(res.status_code, 302, f"Expected 302 redirect for unauthenticated {url}")

    # ---------------------------------------------------------------------
    # Authenticated Customer Tests
    # ---------------------------------------------------------------------
    def test_customer_portal(self):
        self.client.login(username='test_customer', password='testpassword123')

        res = self.client.get('/customer/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Kavita Patel')

        res = self.client.get('/customer/bookings/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'AC Repair & Service')

        res = self.client.get(f'/customer/bookings/{self.booking.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, '4829')  # Completion OTP

        res = self.client.get(f'/customer/track/{self.booking.id}/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Live Technician Tracking')

        res = self.client.get('/customer/passport/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Voltas')

        res = self.client.get('/customer/notifications/')
        self.assertEqual(res.status_code, 200)

        res = self.client.get('/customer/profile/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Kavita')

        res = self.client.get('/book/')
        self.assertEqual(res.status_code, 200)

    # ---------------------------------------------------------------------
    # Authenticated Provider Tests
    # ---------------------------------------------------------------------
    def test_provider_portal(self):
        self.client.login(username='test_provider', password='testpassword123')
        res = self.client.get('/provider/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Ramesh Mistri')
        self.assertContains(res, 'Active Jobs')

    # ---------------------------------------------------------------------
    # Authenticated Partner Tests
    # ---------------------------------------------------------------------
    def test_partner_portal(self):
        self.client.login(username='test_partner', password='testpassword123')
        res = self.client.get('/partner/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Gujarat Cooling Solutions')

    # ---------------------------------------------------------------------
    # Authenticated Support Agent Tests
    # ---------------------------------------------------------------------
    def test_support_desk(self):
        self.client.login(username='test_agent', password='testpassword123')
        res = self.client.get('/support-desk/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Support Agent Help Desk')
        self.assertContains(res, 'TKT-TEST-01')

    # ---------------------------------------------------------------------
    # Authenticated Admin Tests
    # ---------------------------------------------------------------------
    def test_admin_dashboard(self):
        self.client.login(username='test_admin', password='testpassword123')
        res = self.client.get('/admin-dashboard/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Operations Command Center')

        res = self.client.get('/admin-panel/bookings/')
        self.assertEqual(res.status_code, 200)
        self.assertContains(res, 'Platform Bookings Master')
