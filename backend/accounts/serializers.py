import re
from datetime import date

from django.contrib.auth.password_validation import validate_password
from django.utils.text import slugify
from rest_framework import serializers

from django.conf import settings
from .models import User
from .email_service import normalize_email, consume_registration_token


PUBLIC_REGISTER_ROLES = {'CUSTOMER', 'INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER'}
RESTRICTED_ROLES = {'ADMIN', 'SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT'}


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'phone', 'language', 'profile_photo', 'address', 'city', 'state',
            'pin_code', 'date_of_birth', 'gender', 'referral_code',
            'latitude', 'longitude', 'is_verified', 'date_joined',
        ]
        read_only_fields = ['id', 'role', 'is_verified', 'date_joined']


class ProviderRegistrationSerializer(serializers.Serializer):
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    experience_years = serializers.IntegerField(min_value=0, max_value=60, required=False, default=0)
    service_radius_km = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=10)
    visit_charge = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0)
    bio = serializers.CharField(required=False, allow_blank=True, default='')
    working_days = serializers.ListField(child=serializers.IntegerField(min_value=0, max_value=6), required=False, default=list)
    work_start = serializers.TimeField(required=False, default='09:00')
    work_end = serializers.TimeField(required=False, default='18:00')


class PartnerRegistrationSerializer(serializers.Serializer):
    organization_name = serializers.CharField(max_length=200)
    partner_type = serializers.ChoiceField(
        choices=['service_center', 'warranty', 'spare_parts', 'repair_company', 'home_maintenance', 'emergency'],
        default='repair_company',
    )
    authorized_brands = serializers.ListField(child=serializers.CharField(), required=False, default=list)
    category_ids = serializers.ListField(child=serializers.IntegerField(), required=False, default=list)
    business_address = serializers.CharField(required=False, allow_blank=True, default='')
    gst_number = serializers.CharField(required=False, allow_blank=True, default='')
    contact_person = serializers.CharField(required=False, allow_blank=True, default='')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    verification_token = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    role = serializers.ChoiceField(
        choices=sorted(PUBLIC_REGISTER_ROLES),
        default='CUSTOMER',
    )
    terms_accepted = serializers.BooleanField(write_only=True)
    provider_profile = ProviderRegistrationSerializer(required=False)
    partner_profile = PartnerRegistrationSerializer(required=False)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm', 'verification_token', 'first_name', 'last_name',
            'phone', 'role', 'language', 'address', 'city', 'state', 'pin_code',
            'date_of_birth', 'gender', 'referral_code', 'terms_accepted',
            'provider_profile', 'partner_profile',
        ]
        extra_kwargs = {
            'username': {'required': False, 'allow_blank': True},
            'first_name': {'required': True},
            'last_name': {'required': True},
            'phone': {'required': True},
            'email': {'required': True},
            'city': {'required': True},
            'state': {'required': True},
            'pin_code': {'required': True},
        }

    def validate_email(self, value):
        email = normalize_email(value)
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError('This email address is already registered.')
        return email

    def validate_role(self, value):
        if value in RESTRICTED_ROLES:
            raise serializers.ValidationError('This role cannot be registered publicly.')
        if value not in PUBLIC_REGISTER_ROLES:
            raise serializers.ValidationError('Invalid registration role.')
        return value

    def validate_phone(self, value):
        digits = re.sub(r'\D', '', value or '')
        if len(digits) != 10:
            raise serializers.ValidationError('Phone number must contain exactly 10 digits.')
        if User.objects.filter(phone=digits).exists():
            raise serializers.ValidationError('This phone number is already registered.')
        return digits

    def validate_pin_code(self, value):
        digits = re.sub(r'\D', '', value or '')
        if len(digits) != 6:
            raise serializers.ValidationError('PIN code must contain exactly 6 digits.')
        return digits

    def validate_date_of_birth(self, value):
        if value and value > date.today():
            raise serializers.ValidationError('Date of birth cannot be in the future.')
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError('Password must contain at least one uppercase letter.')
        if not re.search(r'[a-z]', value):
            raise serializers.ValidationError('Password must contain at least one lowercase letter.')
        if not re.search(r'\d', value):
            raise serializers.ValidationError('Password must contain at least one number.')
        if not re.search(r'[^A-Za-z0-9]', value):
            raise serializers.ValidationError('Password must contain at least one special character.')
        validate_password(value)
        return value

    def validate(self, data):
        if not data.get('terms_accepted'):
            raise serializers.ValidationError({'terms_accepted': 'You must accept the Terms & Conditions and Privacy Policy.'})
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        role = data.get('role', 'CUSTOMER')
        if role == 'INDIVIDUAL_PROVIDER' and 'provider_profile' not in self.initial_data:
            raise serializers.ValidationError({'provider_profile': 'Provider details are required.'})
        if role == 'THIRD_PARTY_PARTNER':
            partner = data.get('partner_profile')
            if not partner or not partner.get('organization_name'):
                raise serializers.ValidationError({'partner_profile': 'Organization name is required for partners.'})
        if not data.get('username'):
            base = slugify(data['email'].split('@')[0]) or 'user'
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base}{counter}'
                counter += 1
            data['username'] = username
        elif User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})
        token = (data.get('verification_token') or '').strip()
        email = normalize_email(data['email'])
        if getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False):
            if not token:
                raise serializers.ValidationError({
                    'email': ['Please verify your email address before creating your account.'],
                })
            if not consume_registration_token(email, token):
                raise serializers.ValidationError({
                    'email': ['Please verify your email address before creating your account.'],
                    'verification_token': ['Invalid or expired verification token.'],
                })
        data['email'] = email
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('terms_accepted')
        validated_data.pop('verification_token', None)
        provider_data = validated_data.pop('provider_profile', None)
        partner_data = validated_data.pop('partner_profile', None)
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.is_verified = True
        user.save()
        user._registration_provider_data = provider_data
        user._registration_partner_data = partner_data
        return user


class ProfileUpdateSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(required=False)

    def validate_language(self, value):
        if value and value not in ('en', 'gu', 'hi'):
            raise serializers.ValidationError('Language must be en, gu, or hi.')
        return value

    def validate_email(self, value):
        value = normalize_email(value)
        user = self.instance
        if user and user.email.lower() == value:
            return value
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk if user else None).exists():
            raise serializers.ValidationError('This email address is already registered.')
        return value

    def update(self, instance, validated_data):
        new_email = validated_data.get('email')
        if new_email and normalize_email(new_email) != normalize_email(instance.email):
            if getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False):
                verification_token = self.context['request'].data.get('verification_token', '').strip()
                if not verification_token or not consume_registration_token(new_email, verification_token):
                    raise serializers.ValidationError({
                        'email': 'Please verify your new email address before saving.',
                    })
            validated_data['is_verified'] = True
        return super().update(instance, validated_data)

    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'phone', 'language', 'profile_photo',
            'address', 'city', 'state', 'pin_code', 'date_of_birth', 'gender',
            'latitude', 'longitude', 'email',
        ]


class PasswordChangeSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField(validators=[validate_password])


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
