from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import date, time, timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = 'Seed KaamSetu demo data'

    def handle(self, *args, **options):
        from services.models import ServiceCategory, RepairGuide, PriceRange
        from providers.models import ServiceProvider, ThirdPartyPartner, ProviderAvailability
        from bookings.models import Booking, Review
        from ai_diagnosis.models import AIDiagnosis
        from passport.models import HouseholdAsset
        from tracking.models import TrackingSession
        from support.models import SupportTicket, SupportMessage
        from notifications.models import Notification

        self.stdout.write('Seeding KaamSetu demo data...')

        categories_data = [
            ('Plumbing', 'પ્લંબિંગ', 'plumbing', '🔧'),
            ('Electrical', 'વિદ્યુત', 'electrical', '⚡'),
            ('AC & Refrigerator', 'AC અને રેફ્રિજરેટર', 'ac-refrigerator', '❄️'),
            ('Appliance Repair', 'ઉપકરણ Repair', 'appliance-repair', '🔩'),
            ('Carpentry', 'સુથારું', 'carpentry', '🪚'),
            ('Cleaning', 'સફાઈ', 'cleaning', '🧹'),
            ('Wall & Ceiling', 'દીવાલ અને છત', 'wall-ceiling', '🏠'),
            ('Door & Lock', 'દરવાજા અને તાળું', 'door-lock', '🚪'),
            ('RO & Water Purifier', 'RO અને Water Purifier', 'ro-water', '💧'),
            ('Computer & Mobile Repair', 'કમ્પ્યુટર અને Mobile', 'computer-mobile', '📱'),
        ]
        categories = {}
        for i, (name, name_gu, slug, icon) in enumerate(categories_data):
            cat, _ = ServiceCategory.objects.get_or_create(
                slug=slug,
                defaults={'name': name, 'name_gu': name_gu, 'icon': icon, 'sort_order': i},
            )
            categories[slug] = cat

        demo_users = [
            ('customer1', 'CUSTOMER', 'Rahul', 'Shah', 'customer1@KaamSetu.demo', '9876500001'),
            ('customer2', 'CUSTOMER', 'Priya', 'Patel', 'customer2@KaamSetu.demo', '9876500002'),
            ('customer3', 'CUSTOMER', 'Amit', 'Mehta', 'customer3@KaamSetu.demo', '9876500003'),
            ('customer4', 'CUSTOMER', 'Neha', 'Desai', 'customer4@KaamSetu.demo', '9876500004'),
            ('customer5', 'CUSTOMER', 'Vikram', 'Joshi', 'customer5@KaamSetu.demo', '9876500005'),
            ('customer6', 'CUSTOMER', 'Kavita', 'Trivedi', 'customer6@KaamSetu.demo', '9876500006'),
            ('customer7', 'CUSTOMER', 'Suresh', 'Modi', 'customer7@KaamSetu.demo', '9876500007'),
            ('customer8', 'CUSTOMER', 'Anjali', 'Gandhi', 'customer8@KaamSetu.demo', '9876500008'),
            ('customer9', 'CUSTOMER', 'Deepak', 'Pandya', 'customer9@KaamSetu.demo', '9876500009'),
            ('customer10', 'CUSTOMER', 'Meera', 'Vyas', 'customer10@KaamSetu.demo', '9876500010'),
            ('provider1', 'INDIVIDUAL_PROVIDER', 'Rajesh', 'Plumber', 'provider1@KaamSetu.demo', '9876510001'),
            ('provider2', 'INDIVIDUAL_PROVIDER', 'Sunil', 'Electrician', 'provider2@KaamSetu.demo', '9876510002'),
            ('provider3', 'INDIVIDUAL_PROVIDER', 'Mahesh', 'AC Tech', 'provider3@KaamSetu.demo', '9876510003'),
            ('provider4', 'INDIVIDUAL_PROVIDER', 'Kiran', 'Carpenter', 'provider4@KaamSetu.demo', '9876510004'),
            ('provider5', 'INDIVIDUAL_PROVIDER', 'Dinesh', 'Appliance', 'provider5@KaamSetu.demo', '9876510005'),
            ('provider6', 'INDIVIDUAL_PROVIDER', 'Harsh', 'RO Expert', 'provider6@KaamSetu.demo', '9876510006'),
            ('provider7', 'INDIVIDUAL_PROVIDER', 'Nilesh', 'Handyman', 'provider7@KaamSetu.demo', '9876510007'),
            ('provider8', 'INDIVIDUAL_PROVIDER', 'Paresh', 'Cleaner', 'provider8@KaamSetu.demo', '9876510008'),
            ('partner1', 'THIRD_PARTY_PARTNER', 'LG', 'Service', 'partner1@KaamSetu.demo', '9876520001'),
            ('partner2', 'THIRD_PARTY_PARTNER', 'Samsung', 'Care', 'partner2@KaamSetu.demo', '9876520002'),
            ('partner3', 'THIRD_PARTY_PARTNER', 'Urban', 'Clap', 'partner3@KaamSetu.demo', '9876520003'),
            ('partner4', 'THIRD_PARTY_PARTNER', 'Emergency', 'Fix', 'partner4@KaamSetu.demo', '9876520004'),
            ('partner5', 'THIRD_PARTY_PARTNER', 'Ahmedabad', 'Parts', 'partner5@KaamSetu.demo', '9876520005'),
            ('support1', 'SUPPORT_AGENT', 'Support', 'Agent', 'support1@KaamSetu.demo', '9876530001'),
            ('senior1', 'SENIOR_SUPPORT_AGENT', 'Senior', 'Support', 'senior1@KaamSetu.demo', '9876530002'),
            ('admin', 'ADMIN', 'Admin', 'KaamSetu', 'admin@KaamSetu.demo', '9876540000'),
        ]

        users = {}
        for username, role, first, last, email, phone in demo_users:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': email, 'first_name': first, 'last_name': last,
                    'role': role, 'phone': phone, 'language': 'en',
                    'address': 'Satellite, Ahmedabad, Gujarat',
                    'latitude': Decimal('23.0225'), 'longitude': Decimal('72.5714'),
                },
            )
            if created:
                user.set_password('Demo@123')
                user.save()
            users[username] = user

        ahmedabad_coords = [
            (23.0225, 72.5714), (23.0300, 72.5800), (23.0150, 72.5600),
            (23.0350, 72.5500), (23.0100, 72.5900), (23.0400, 72.5650),
            (23.0250, 72.5450), (23.0180, 72.5750),
        ]
        provider_profiles = [
            ('provider1', 'plumbing', 5, 150, 4.8, 45),
            ('provider2', 'electrical', 8, 200, 4.6, 38),
            ('provider3', 'ac-refrigerator', 6, 350, 4.9, 52),
            ('provider4', 'carpentry', 10, 180, 4.5, 30),
            ('provider5', 'appliance-repair', 7, 250, 4.7, 41),
            ('provider6', 'ro-water', 4, 300, 4.8, 28),
            ('provider7', 'door-lock', 12, 120, 4.4, 55),
            ('provider8', 'cleaning', 3, 100, 4.3, 22),
        ]
        providers = {}
        for i, (uname, cat_slug, exp, charge, rating, jobs) in enumerate(provider_profiles):
            lat, lon = ahmedabad_coords[i]
            prov, _ = ServiceProvider.objects.get_or_create(
                user=users[uname],
                defaults={
                    'bio': f'Verified professional in {cat_slug}',
                    'experience_years': exp,
                    'visit_charge': charge,
                    'base_latitude': Decimal(str(lat)),
                    'base_longitude': Decimal(str(lon)),
                    'verification_status': 'verified',
                    'average_rating': Decimal(str(rating)),
                    'total_reviews': jobs // 2,
                    'completed_jobs': jobs,
                    'on_time_rate': Decimal('92'),
                    'response_rate': Decimal('88'),
                    'is_demo': True,
                },
            )
            prov.categories.add(categories[cat_slug])
            prov.calculate_trust_score()
            prov.save()
            for day in range(5):
                ProviderAvailability.objects.get_or_create(
                    provider=prov, day_of_week=day,
                    defaults={'start_time': time(8, 0), 'end_time': time(20, 0)},
                )
            providers[uname] = prov

        partner_data = [
            ('partner1', 'LG Authorized Service Center Ahmedabad', 'service_center', ['LG'], 'ac-refrigerator'),
            ('partner2', 'Samsung Care Satellite', 'warranty', ['Samsung'], 'appliance-repair'),
            ('partner3', 'UrbanClap Ahmedabad', 'home_maintenance', [], 'cleaning'),
            ('partner4', '24x7 Emergency Home Fix', 'emergency', [], 'plumbing'),
            ('partner5', 'Ahmedabad Spare Parts Hub', 'spare_parts', ['Universal'], 'appliance-repair'),
        ]
        for i, (uname, org, ptype, brands, cat_slug) in enumerate(partner_data):
            lat, lon = ahmedabad_coords[i]
            part, _ = ThirdPartyPartner.objects.get_or_create(
                user=users[uname],
                defaults={
                    'organization_name': org,
                    'partner_type': ptype,
                    'authorized_brands': brands,
                    'latitude': Decimal(str(lat)),
                    'longitude': Decimal(str(lon)),
                    'verification_status': 'verified',
                    'average_rating': Decimal('4.5'),
                    'completed_jobs': 100 + i * 20,
                    'badges': ['Verified Business'],
                    'warranty_support': ptype == 'warranty',
                    'spare_parts_available': ptype == 'spare_parts',
                    'emergency_available': ptype == 'emergency',
                    'is_demo': True,
                },
            )
            part.categories.add(categories[cat_slug])
            from providers.models import PartnerTechnician, TechnicianAvailability, PartnerWarrantyClaim, PartnerSparePart
            tech, _ = PartnerTechnician.objects.get_or_create(
                partner=part, name=f'{org} Technician 1',
                defaults={'phone': f'987652100{i}', 'is_active': True},
            )
            tech.categories.add(categories[cat_slug])
            for day in range(5):
                TechnicianAvailability.objects.get_or_create(
                    technician=tech, day_of_week=day,
                    defaults={'start_time': time(9, 0), 'end_time': time(18, 0)},
                )
            PartnerWarrantyClaim.objects.get_or_create(
                partner=part, customer_name='Demo Customer',
                defaults={'appliance_brand': brands[0] if brands else 'Generic', 'issue_description': 'Demo warranty claim', 'is_demo': True},
            )
            PartnerSparePart.objects.get_or_create(
                partner=part, name=f'{cat_slug} spare kit',
                defaults={'brand': brands[0] if brands else 'Universal', 'price': 500 + i * 100, 'is_demo': True},
            )

        guides = [
            ('tap-washer-replacement', 'Tap Washer Replacement', 'plumbing', 'easy', '20 min', 50, 150),
            ('loose-chair-screw', 'Loose Chair Screw Fix', 'carpentry', 'easy', '10 min', 20, 50),
            ('door-hinge-tightening', 'Door Hinge Tightening', 'door-lock', 'easy', '15 min', 30, 80),
            ('basic-drain-blockage', 'Basic Drain Blockage', 'plumbing', 'medium', '30 min', 50, 200),
            ('ac-filter-cleaning', 'AC Filter Cleaning', 'ac-refrigerator', 'easy', '25 min', 0, 100),
            ('ro-filter-reminder', 'RO Filter Change Reminder', 'ro-water', 'medium', '45 min', 300, 800),
            ('wall-stain-cleaning', 'Wall Stain Cleaning', 'wall-ceiling', 'easy', '30 min', 50, 150),
            ('curtain-rod-tightening', 'Curtain Rod Tightening', 'carpentry', 'easy', '15 min', 30, 80),
        ]
        for slug, title, cat_slug, diff, est_time, cmin, cmax in guides:
            RepairGuide.objects.get_or_create(
                slug=slug,
                defaults={
                    'category': categories[cat_slug],
                    'title': title,
                    'title_gu': title,
                    'problem': f'Guide for {title}',
                    'difficulty': diff,
                    'estimated_time': est_time,
                    'estimated_cost_min': cmin,
                    'estimated_cost_max': cmax,
                    'tools': ['Screwdriver', 'Wrench'],
                    'materials': ['Basic parts'],
                    'safety_warning': 'Turn off water/power before starting.',
                    'steps': [
                        {'step': 1, 'title': 'Prepare', 'description': 'Gather tools and turn off supply.'},
                        {'step': 2, 'title': 'Inspect', 'description': 'Identify the problem area.'},
                        {'step': 3, 'title': 'Fix', 'description': 'Apply the repair carefully.'},
                        {'step': 4, 'title': 'Test', 'description': 'Verify the fix works properly.'},
                    ],
                    'is_demo': True,
                },
            )

        customer = users['customer1']
        for i, (uname, status_val) in enumerate([
            ('provider1', 'completed'), ('provider2', 'on_the_way'),
            ('provider3', 'accepted'), ('provider1', 'requested'),
            ('provider4', 'started'), ('provider5', 'completed'),
            ('provider6', 'cancelled'), ('provider7', 'arrived'),
            ('provider8', 'preparing'), ('provider2', 'completed'),
            ('provider3', 'requested'), ('provider1', 'disputed'),
            ('provider4', 'completed'), ('provider5', 'accepted'),
            ('provider6', 'completed'),
        ]):
            prov = providers[uname]
            cat = prov.categories.first()
            sched = timezone.now() + timedelta(days=i - 7)
            Booking.objects.get_or_create(
                customer=customer if i % 3 == 0 else users[f'customer{(i % 10) + 1}'],
                provider=prov,
                category=cat,
                issue_description=f'Demo booking issue #{i + 1}',
                address='Satellite, Ahmedabad',
                latitude=Decimal('23.0225'),
                longitude=Decimal('72.5714'),
                scheduled_start=sched,
                scheduled_end=sched + timedelta(hours=2),
                status=status_val,
                estimated_price_min=200,
                estimated_price_max=800,
                visit_charge=prov.visit_charge,
                is_demo=True,
                defaults={'completion_otp': '123456' if status_val == 'completed' else ''},
            )

        from providers.models import ThirdPartyPartner
        for i, pname in enumerate(['partner1', 'partner2', 'partner3']):
            part = ThirdPartyPartner.objects.get(user=users[pname])
            cat = part.categories.first() or list(categories.values())[0]
            sched = timezone.now() + timedelta(days=i + 1)
            Booking.objects.get_or_create(
                customer=users[f'customer{i + 2}'],
                partner=part,
                category=cat,
                issue_description=f'Demo partner booking #{i + 1}',
                address='Satellite, Ahmedabad',
                latitude=Decimal('23.0225'),
                longitude=Decimal('72.5714'),
                scheduled_start=sched,
                scheduled_end=sched + timedelta(hours=2),
                status=['requested', 'accepted', 'preparing'][i],
                is_demo=True,
            )

        for i in range(8):
            AIDiagnosis.objects.get_or_create(
                user=users[f'customer{(i % 10) + 1}'],
                category='Plumbing' if i % 2 == 0 else 'Electrical',
                possible_issue=f'Demo diagnosis issue #{i + 1}',
                defaults={
                    'confidence_score': 75 + i,
                    'severity': 'low',
                    'decision': 'DIY with Caution',
                    'estimated_cost_min': 100,
                    'estimated_cost_max': 500,
                    'is_demo_mode': True,
                },
            )

        for i, atype in enumerate(['ac', 'refrigerator', 'washing_machine', 'geyser', 'ro', 'fan']):
            HouseholdAsset.objects.get_or_create(
                owner=users['customer1'],
                asset_type=atype,
                defaults={
                    'brand': ['LG', 'Samsung', 'Whirlpool', 'Bajaj', 'Kent', 'Crompton'][i],
                    'model_name': f'Model-{i + 1}',
                    'health_score': 70 + i * 3,
                    'is_demo': True,
                },
            )

        completed = Booking.objects.filter(status='completed', is_demo=True).first()
        if completed:
            TrackingSession.objects.get_or_create(
                booking=completed,
                defaults={
                    'provider': completed.provider.user,
                    'is_active': False,
                    'is_demo_mode': True,
                    'customer_latitude': completed.latitude,
                    'customer_longitude': completed.longitude,
                },
            )

        for i in range(8):
            ticket_num = f'FM-DEMO{i:04d}'
            SupportTicket.objects.get_or_create(
                ticket_number=ticket_num,
                defaults={
                    'customer': users[f'customer{(i % 5) + 1}'],
                    'category': ['booking', 'payment', 'ai', 'safety'][i % 4],
                    'subject': f'Demo support ticket #{i + 1}',
                    'description': 'Demo support issue description.',
                    'status': ['open', 'assigned', 'resolved'][i % 3],
                    'is_demo': True,
                },
            )

        for i in range(10):
            Notification.objects.get_or_create(
                user=users[f'customer{(i % 10) + 1}'],
                title=f'Demo notification #{i + 1}',
                defaults={
                    'notification_type': 'system',
                    'message': 'This is demo notification data.',
                    'is_demo': True,
                },
            )

        for cat in categories.values():
            PriceRange.objects.get_or_create(
                category=cat,
                service_name=f'{cat.name} Service',
                defaults={
                    'visit_charge_min': 100, 'visit_charge_max': 300,
                    'labour_min': 200, 'labour_max': 800,
                    'material_min': 50, 'material_max': 500,
                    'is_demo': True,
                },
            )

        self.stdout.write(self.style.SUCCESS('Demo data seeded successfully!'))
        self.stdout.write('Demo accounts (password: Demo@123):')
        self.stdout.write('  customer1@KaamSetu.demo (Customer)')
        self.stdout.write('  provider1@KaamSetu.demo (Provider)')
        self.stdout.write('  partner1@KaamSetu.demo (Partner)')
        self.stdout.write('  support1@KaamSetu.demo (Support Agent)')
        self.stdout.write('  senior1@KaamSetu.demo (Senior Support)')
        self.stdout.write('  admin@KaamSetu.demo (Admin)')
