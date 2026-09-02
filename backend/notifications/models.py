from django.conf import settings
from django.db import models


class Notification(models.Model):
    class NotificationType(models.TextChoices):
        BOOKING = 'booking', 'Booking'
        REMINDER = 'reminder', 'Reminder'
        SUPPORT = 'support', 'Support'
        SYSTEM = 'system', 'System'
        PROMOTION = 'promotion', 'Promotion'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NotificationType.choices)
    title = models.CharField(max_length=200)
    title_gu = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    message_gu = models.TextField(blank=True)
    link = models.CharField(max_length=200, blank=True)
    is_read = models.BooleanField(default=False)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.title} -> {self.user.username}'
