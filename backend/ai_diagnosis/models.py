from django.conf import settings
from django.db import models


class AIDiagnosis(models.Model):
    class Decision(models.TextChoices):
        SAFE_DIY = 'Safe DIY', 'Safe DIY'
        DIY_CAUTION = 'DIY with Caution', 'DIY with Caution'
        CALL_PROFESSIONAL = 'Call Professional', 'Call Professional'
        NEED_MORE_INFO = 'Need More Information', 'Need More Information'

    class Severity(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='diagnoses', null=True, blank=True)
    category = models.CharField(max_length=100, blank=True)
    possible_issue = models.TextField(blank=True)
    confidence_score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    severity = models.CharField(max_length=10, choices=Severity.choices, default=Severity.LOW)
    decision = models.CharField(max_length=30, choices=Decision.choices, default=Decision.NEED_MORE_INFO)
    estimated_cost_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_cost_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_time = models.CharField(max_length=50, blank=True)
    required_tools = models.JSONField(default=list)
    required_parts = models.JSONField(default=list)
    safety_warning = models.TextField(blank=True)
    instructions = models.JSONField(default=list)
    recommended_provider_category = models.CharField(max_length=100, blank=True)
    input_text = models.TextField(blank=True)
    input_language = models.CharField(max_length=5, default='en')
    image = models.ImageField(upload_to='diagnosis_images/', blank=True, null=True)
    video = models.FileField(upload_to='diagnosis_videos/', blank=True, null=True)
    audio = models.FileField(upload_to='diagnosis_audio/', blank=True, null=True)
    is_dangerous = models.BooleanField(default=False)
    is_demo_mode = models.BooleanField(default=False)
    raw_response = models.JSONField(default=dict, blank=True)
    saved_to_passport = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'AI Diagnoses'
        ordering = ['-created_at']

    def __str__(self):
        return f'Diagnosis #{self.pk} - {self.category}'
