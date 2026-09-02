from django.conf import settings
from django.db import models
from django.utils import timezone
import uuid
from services.models import ServiceCategory
from providers.models import ServiceProvider, ThirdPartyPartner, PartnerTechnician
from ai_diagnosis.models import AIDiagnosis


class Booking(models.Model):
    class Status(models.TextChoices):
        REQUESTED = 'requested', 'Requested'
        ACCEPTED = 'accepted', 'Accepted'
        REJECTED = 'rejected', 'Rejected'
        PREPARING = 'preparing', 'Preparing'
        ON_THE_WAY = 'on_the_way', 'On The Way'
        ARRIVED = 'arrived', 'Arrived'
        STARTED = 'started', 'Started'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        DISPUTED = 'disputed', 'Disputed'

    class SlotStatus(models.TextChoices):
        SLOT_REQUESTED = 'slot_requested', 'Slot Requested'
        AWAITING_CONFIRMATION = 'awaiting_confirmation', 'Awaiting Provider Confirmation'
        SLOT_PROPOSED = 'slot_proposed', 'Slot Proposed'
        SLOT_HELD = 'slot_held', 'Slot Held Temporarily'
        CONFIRMED = 'confirmed', 'Confirmed'
        RESCHEDULE_REQUESTED = 'reschedule_requested', 'Reschedule Requested'
        RESCHEDULED = 'rescheduled', 'Rescheduled'
        CANCELLED = 'cancelled', 'Cancelled'
        NO_SHOW = 'no_show', 'No Show'
        DISPUTED = 'disputed', 'Disputed'

    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bookings')
    category = models.ForeignKey(ServiceCategory, on_delete=models.PROTECT, related_name='bookings')
    diagnosis = models.ForeignKey(AIDiagnosis, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    provider = models.ForeignKey(ServiceProvider, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    technician = models.ForeignKey(PartnerTechnician, on_delete=models.SET_NULL, null=True, blank=True, related_name='bookings')
    issue_description = models.TextField()
    address = models.TextField()
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    preferred_date = models.DateField(null=True, blank=True)
    preferred_time_start = models.TimeField(null=True, blank=True)
    preferred_time_end = models.TimeField(null=True, blank=True)
    scheduled_start = models.DateTimeField(null=True, blank=True)
    scheduled_end = models.DateTimeField(null=True, blank=True)
    flexible_timing = models.BooleanField(default=False)
    access_instructions = models.TextField(blank=True)
    contact_person = models.CharField(max_length=100, blank=True)
    preferred_language = models.CharField(max_length=5, default='en')
    allow_contact = models.BooleanField(default=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.REQUESTED)
    slot_status = models.CharField(max_length=30, choices=SlotStatus.choices, default=SlotStatus.SLOT_REQUESTED)
    estimated_price_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_price_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    visit_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    completion_otp = models.CharField(max_length=6, blank=True)
    otp_verified = models.BooleanField(default=False)
    issue_photo = models.ImageField(upload_to='booking_issues/', blank=True, null=True)
    before_photo = models.ImageField(upload_to='booking_before/', blank=True, null=True)
    after_photo = models.ImageField(upload_to='booking_after/', blank=True, null=True)
    notes = models.TextField(blank=True)
    cancellation_reason = models.TextField(blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'scheduled_start']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['provider', 'scheduled_start']),
        ]

    def __str__(self):
        return f'Booking #{self.pk} - {self.customer.username}'


def generate_invoice_number():
    return f'INV-{uuid.uuid4().hex[:8].upper()}'


class BookingInvoice(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='invoice')
    invoice_number = models.CharField(max_length=20, unique=True, default=generate_invoice_number)
    visit_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    extra_charges = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_demo = models.BooleanField(default=True)
    notes = models.TextField(blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.invoice_number


class AppointmentSlot(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='slots', null=True, blank=True)
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, null=True, blank=True, related_name='appointment_slots')
    technician = models.ForeignKey(PartnerTechnician, on_delete=models.CASCADE, null=True, blank=True, related_name='appointment_slots')
    start_datetime = models.DateTimeField()
    end_datetime = models.DateTimeField()
    is_preferred = models.BooleanField(default=False)
    is_alternative = models.BooleanField(default=False)
    is_held = models.BooleanField(default=False)
    hold_expires_at = models.DateTimeField(null=True, blank=True)
    is_confirmed = models.BooleanField(default=False)
    eta_minutes = models.PositiveIntegerField(null=True, blank=True)
    price_estimate = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [models.Index(fields=['provider', 'start_datetime', 'end_datetime'])]


class CustomerAvailability(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='customer_availability')
    preferred_date = models.DateField()
    preferred_start = models.TimeField()
    preferred_end = models.TimeField()
    alternative_slots = models.JSONField(default=list)
    flexible_timing = models.BooleanField(default=False)
    service_duration_minutes = models.PositiveIntegerField(default=60)


class ScheduleChange(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='schedule_changes')
    old_start = models.DateTimeField(null=True, blank=True)
    old_end = models.DateTimeField(null=True, blank=True)
    new_start = models.DateTimeField(null=True, blank=True)
    new_end = models.DateTimeField(null=True, blank=True)
    reason = models.TextField(blank=True)
    changed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)


class AppointmentReminder(models.Model):
    booking = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='reminders')
    remind_at = models.DateTimeField()
    sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class Review(models.Model):
    booking = models.OneToOneField(Booking, on_delete=models.CASCADE, related_name='review')
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews_given')
    provider = models.ForeignKey(ServiceProvider, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.SET_NULL, null=True, blank=True, related_name='reviews')
    rating = models.PositiveSmallIntegerField()
    comment = models.TextField(blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)


class ProviderRecommendation(models.Model):
    diagnosis = models.ForeignKey(AIDiagnosis, on_delete=models.CASCADE, related_name='recommendations')
    provider = models.ForeignKey(ServiceProvider, on_delete=models.CASCADE, null=True, blank=True)
    partner = models.ForeignKey(ThirdPartyPartner, on_delete=models.CASCADE, null=True, blank=True)
    section = models.CharField(max_length=50)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    eta_minutes = models.PositiveIntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
