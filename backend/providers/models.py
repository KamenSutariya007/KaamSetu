from django.conf import settings
from django.db import models
from services.models import ServiceCategory


class ServiceProvider(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='provider_profile')
    bio = models.TextField(blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    visit_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    service_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=10)
    base_latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    base_longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    categories = models.ManyToManyField(ServiceCategory, related_name='providers', blank=True)
    verification_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')],
        default='pending',
    )
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    completed_jobs = models.PositiveIntegerField(default=0)
    on_time_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    response_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    trust_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_earnings = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    emergency_available = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def calculate_trust_score(self):
        rating_score = min(float(self.average_rating) / 5 * 100, 100) * 0.30
        jobs_score = min(self.completed_jobs / 100 * 100, 100) * 0.25
        verify_score = 100 * 0.20 if self.verification_status == 'verified' else 0
        ontime_score = min(float(self.on_time_rate), 100) * 0.15
        response_score = min(float(self.response_rate), 100) * 0.10
        self.trust_score = round(rating_score + jobs_score + verify_score + ontime_score + response_score, 2)
        return self.trust_score

    def __str__(self):
        return f'Provider: {self.user.get_full_name() or self.user.username}'


class ProviderDocument(models.Model):
    class DocType(models.TextChoices):
        ID = 'id', 'Identity'
        CERTIFICATE = 'certificate', 'Skill Certificate'
        OTHER = 'other', 'Other'

    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='documents')
    doc_type = models.CharField(max_length=20, choices=DocType.choices)
    file = models.FileField(upload_to='provider_docs/')
    verified = models.BooleanField(default=False)
    uploaded_at = models.DateTimeField(auto_now_add=True)


class ProviderAvailability(models.Model):
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.PositiveSmallIntegerField()  # 0=Monday
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)


class ProviderBlockedSlot(models.Model):
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, related_name='blocked_slots')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ThirdPartyPartner(models.Model):
    class PartnerType(models.TextChoices):
        SERVICE_CENTER = 'service_center', 'Authorized Service Center'
        WARRANTY = 'warranty', 'Warranty Center'
        SPARE_PARTS = 'spare_parts', 'Spare Parts Seller'
        REPAIR_COMPANY = 'repair_company', 'Local Repair Company'
        HOME_MAINTENANCE = 'home_maintenance', 'Home Maintenance Company'
        EMERGENCY = 'emergency', 'Emergency Service'
        INSURANCE = 'insurance', 'Insurance Partner'
        TOOL_RENTAL = 'tool_rental', 'Tool Rental'
        SOCIETY = 'society', 'Society Maintenance'

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='partner_profile')
    organization_name = models.CharField(max_length=200)
    partner_type = models.CharField(max_length=30, choices=PartnerType.choices)
    description = models.TextField(blank=True)
    authorized_brands = models.JSONField(default=list)
    categories = models.ManyToManyField(ServiceCategory, related_name='partners', blank=True)
    address = models.TextField(blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    service_radius_km = models.DecimalField(max_digits=5, decimal_places=2, default=15)
    verification_status = models.CharField(
        max_length=20,
        choices=[('pending', 'Pending'), ('verified', 'Verified'), ('rejected', 'Rejected')],
        default='pending',
    )
    badges = models.JSONField(default=list)
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0)
    total_reviews = models.PositiveIntegerField(default=0)
    completed_jobs = models.PositiveIntegerField(default=0)
    response_time_hours = models.DecimalField(max_digits=5, decimal_places=2, default=2)
    trust_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_revenue = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    emergency_available = models.BooleanField(default=False)
    warranty_support = models.BooleanField(default=False)
    spare_parts_available = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    gst_number = models.CharField(max_length=20, blank=True)
    contact_person = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return self.organization_name


class PartnerTechnician(models.Model):
    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.CASCADE, related_name='technicians')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=15, blank=True)
    categories = models.ManyToManyField(ServiceCategory, blank=True)
    is_active = models.BooleanField(default=True)


class TechnicianAvailability(models.Model):
    technician = models.ForeignKey(PartnerTechnician, on_delete=models.CASCADE, related_name='availability')
    day_of_week = models.PositiveSmallIntegerField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_available = models.BooleanField(default=True)


class PartnerWarrantyClaim(models.Model):
    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        IN_PROGRESS = 'in_progress', 'In Progress'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'
        CLOSED = 'closed', 'Closed'

    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.CASCADE, related_name='warranty_claims')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=100)
    appliance_brand = models.CharField(max_length=100, blank=True)
    issue_description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class PartnerQuotation(models.Model):
    class Status(models.TextChoices):
        DRAFT = 'draft', 'Draft'
        SENT = 'sent', 'Sent'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'

    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.CASCADE, related_name='quotations')
    booking = models.ForeignKey('bookings.Booking', on_delete=models.SET_NULL, null=True, blank=True)
    customer_name = models.CharField(max_length=100)
    description = models.TextField()
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class PartnerSparePart(models.Model):
    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.CASCADE, related_name='spare_parts')
    name = models.CharField(max_length=200)
    brand = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    in_stock = models.BooleanField(default=True)
    is_demo = models.BooleanField(default=False)
