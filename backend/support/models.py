from django.conf import settings
from django.db import models


class SupportTicket(models.Model):
    class Category(models.TextChoices):
        BOOKING = 'booking', 'Booking Problem'
        PROVIDER = 'provider', 'Provider Behaviour'
        PAYMENT = 'payment', 'Payment/Invoice'
        CANCELLATION = 'cancellation', 'Cancellation'
        REFUND = 'refund', 'Refund'
        AI = 'ai', 'AI Guidance'
        TRACKING = 'tracking', 'Live Tracking'
        SAFETY = 'safety', 'Safety'
        TECHNICAL = 'technical', 'Technical'
        ACCOUNT = 'account', 'Account'
        PARTNER = 'partner', 'Partner/Warranty'
        OTHER = 'other', 'Other'

    class Status(models.TextChoices):
        OPEN = 'open', 'Open'
        ASSIGNED = 'assigned', 'Assigned'
        IN_PROGRESS = 'in_progress', 'In Progress'
        WAITING_CUSTOMER = 'waiting_customer', 'Waiting for Customer'
        ESCALATED = 'escalated', 'Escalated'
        RESOLVED = 'resolved', 'Resolved'
        CLOSED = 'closed', 'Closed'

    ticket_number = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets')
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='assigned_tickets'
    )
    category = models.CharField(max_length=20, choices=Category.choices)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.OPEN)
    priority = models.CharField(max_length=10, default='normal')
    is_escalated = models.BooleanField(default=False)
    escalation_reason = models.TextField(blank=True)
    support_rating = models.PositiveSmallIntegerField(null=True, blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.ticket_number} - {self.subject}'


class SupportMessage(models.Model):
    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    is_internal = models.BooleanField(default=False)
    attachment = models.FileField(upload_to='support_attachments/', blank=True, null=True)
    is_ai = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']


class SupportAgent(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_agent_profile')
    is_senior = models.BooleanField(default=False)
    categories = models.JSONField(default=list)
    is_available = models.BooleanField(default=True)
    tickets_resolved = models.PositiveIntegerField(default=0)
