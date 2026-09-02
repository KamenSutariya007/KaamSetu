from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        CUSTOMER = 'CUSTOMER', 'Customer'
        INDIVIDUAL_PROVIDER = 'INDIVIDUAL_PROVIDER', 'Individual Provider'
        THIRD_PARTY_PARTNER = 'THIRD_PARTY_PARTNER', 'Third Party Partner'
        SUPPORT_AGENT = 'SUPPORT_AGENT', 'Support Agent'
        SENIOR_SUPPORT_AGENT = 'SENIOR_SUPPORT_AGENT', 'Senior Support Agent'
        ADMIN = 'ADMIN', 'Admin'

    class Language(models.TextChoices):
        EN = 'en', 'English'
        GU = 'gu', 'Gujarati'
        HI = 'hi', 'Hindi'

    class Gender(models.TextChoices):
        MALE = 'male', 'Male'
        FEMALE = 'female', 'Female'
        OTHER = 'other', 'Other'
        PREFER_NOT = 'prefer_not', 'Prefer not to say'

    role = models.CharField(max_length=30, choices=Role.choices, default=Role.CUSTOMER)
    phone = models.CharField(max_length=15, blank=True)
    language = models.CharField(max_length=5, choices=Language.choices, default=Language.EN)
    profile_photo = models.ImageField(upload_to='profiles/', blank=True, null=True)
    address = models.TextField(blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True, default='Gujarat')
    pin_code = models.CharField(max_length=6, blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    gender = models.CharField(max_length=20, choices=Gender.choices, blank=True)
    referral_code = models.CharField(max_length=50, blank=True)
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)
    firebase_uid = models.CharField(max_length=128, blank=True, null=True, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [models.Index(fields=['role', 'email'])]

    def __str__(self):
        return f'{self.get_full_name() or self.username} ({self.role})'


class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reset_tokens')
    token = models.CharField(max_length=64, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)


class EmailVerification(models.Model):
    class Purpose(models.TextChoices):
        REGISTRATION = 'registration', 'Registration'
        LOGIN = 'login', 'Login'
        PASSWORD_RESET = 'password_reset', 'Password Reset'

    email = models.EmailField(db_index=True)
    purpose = models.CharField(
        max_length=20,
        choices=Purpose.choices,
        default=Purpose.REGISTRATION,
        db_index=True,
    )
    otp_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    verified_at = models.DateTimeField(null=True, blank=True)
    attempt_count = models.PositiveSmallIntegerField(default=0)
    resend_count = models.PositiveSmallIntegerField(default=0)
    last_sent_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        indexes = [
            models.Index(fields=['email', 'purpose', '-created_at']),
        ]


class LoginChallenge(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='login_challenges')
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['token']),
            models.Index(fields=['user', '-created_at']),
        ]


class RegistrationVerificationToken(models.Model):
    email = models.EmailField(db_index=True)
    token = models.CharField(max_length=64, unique=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['email', '-created_at']),
        ]
