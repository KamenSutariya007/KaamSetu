from django.conf import settings
from django.db import models
from ai_diagnosis.models import AIDiagnosis


class HouseholdAsset(models.Model):
    class AssetType(models.TextChoices):
        AC = 'ac', 'AC'
        REFRIGERATOR = 'refrigerator', 'Refrigerator'
        WASHING_MACHINE = 'washing_machine', 'Washing Machine'
        GEYSER = 'geyser', 'Geyser'
        RO = 'ro', 'RO Water Purifier'
        FAN = 'fan', 'Fan'
        INVERTER = 'inverter', 'Inverter'
        LAPTOP = 'laptop', 'Laptop'
        OTHER = 'other', 'Other'

    class Condition(models.TextChoices):
        EXCELLENT = 'excellent', 'Excellent'
        GOOD = 'good', 'Good'
        FAIR = 'fair', 'Fair'
        POOR = 'poor', 'Poor'

    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='household_assets')
    asset_type = models.CharField(max_length=30, choices=AssetType.choices)
    brand = models.CharField(max_length=100, blank=True)
    model_name = models.CharField(max_length=100, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    warranty_end = models.DateField(null=True, blank=True)
    last_service = models.DateField(null=True, blank=True)
    next_service = models.DateField(null=True, blank=True)
    condition = models.CharField(max_length=10, choices=Condition.choices, default=Condition.GOOD)
    health_score = models.PositiveSmallIntegerField(default=80)
    notes = models.TextField(blank=True)
    is_demo = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.get_asset_type_display()} - {self.brand} {self.model_name}'


class MaintenanceRecord(models.Model):
    asset = models.ForeignKey(HouseholdAsset, on_delete=models.CASCADE, related_name='maintenance_records')
    service_date = models.DateField()
    service_type = models.CharField(max_length=100)
    provider_name = models.CharField(max_length=200, blank=True)
    cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    parts_replaced = models.JSONField(default=list)
    notes = models.TextField(blank=True)
    invoice = models.FileField(upload_to='maintenance_invoices/', blank=True, null=True)
    diagnosis = models.ForeignKey(AIDiagnosis, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-service_date']
