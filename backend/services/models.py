from django.db import models


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100)
    name_gu = models.CharField(max_length=100, blank=True)
    slug = models.SlugField(unique=True)
    icon = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name_plural = 'Service Categories'
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class RepairGuide(models.Model):
    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='guides')
    title = models.CharField(max_length=200)
    title_gu = models.CharField(max_length=200, blank=True)
    slug = models.SlugField(unique=True)
    problem = models.TextField()
    problem_gu = models.TextField(blank=True)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.EASY)
    estimated_time = models.CharField(max_length=50)
    estimated_cost_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    estimated_cost_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tools = models.JSONField(default=list)
    materials = models.JSONField(default=list)
    safety_warning = models.TextField(blank=True)
    safety_warning_gu = models.TextField(blank=True)
    steps = models.JSONField(default=list)
    steps_gu = models.JSONField(default=list)
    is_demo = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class PriceRange(models.Model):
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='price_ranges')
    service_name = models.CharField(max_length=200)
    visit_charge_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    visit_charge_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    labour_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_min = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    material_max = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    city = models.CharField(max_length=100, default='Ahmedabad')
    is_demo = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'{self.service_name} - {self.city}'
