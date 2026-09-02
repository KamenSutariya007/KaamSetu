from django.contrib.auth import get_user_model
from rest_framework import serializers

from .email_serializers import GoogleAuthSerializer
from .serializers import RegisterSerializer, RESTRICTED_ROLES, PUBLIC_REGISTER_ROLES
from . import firebase_auth
from .email_service import normalize_email

User = get_user_model()


class FirebaseAuthSerializer(GoogleAuthSerializer):
    """Login with Firebase ID token (same shape as Google auth)."""
    id_token = serializers.CharField()


class FirebaseRegisterSerializer(RegisterSerializer):
    id_token = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')
    password_confirm = serializers.CharField(write_only=True, required=False, allow_blank=True, default='')

    class Meta(RegisterSerializer.Meta):
        fields = RegisterSerializer.Meta.fields + ['id_token']

    def validate_password(self, value):
        return value or ''

    def validate_password_confirm(self, value):
        return value or ''

    def validate(self, data):
        token = (data.pop('id_token', None) or self.initial_data.get('id_token') or '').strip()
        identity = firebase_auth.verify_firebase_id_token(token)
        if not identity:
            raise serializers.ValidationError({'id_token': 'Invalid or expired Firebase token.'})
        if not identity.get('email_verified'):
            raise serializers.ValidationError({
                'email': 'Please verify your email address before creating your account.',
            })

        email = normalize_email(data['email'])
        if email != identity['email']:
            raise serializers.ValidationError({'email': 'Email does not match your verified Firebase account.'})

        data.pop('password', None)
        data.pop('password_confirm', None)
        data['verification_token'] = ''
        data['email'] = email
        data['_firebase_uid'] = identity['uid']

        if not data.get('terms_accepted'):
            raise serializers.ValidationError({
                'terms_accepted': 'You must accept the Terms & Conditions and Privacy Policy.',
            })

        role = data.get('role', 'CUSTOMER')
        if role in RESTRICTED_ROLES:
            raise serializers.ValidationError({'role': 'This role cannot be registered publicly.'})
        if role not in PUBLIC_REGISTER_ROLES:
            raise serializers.ValidationError({'role': 'Invalid registration role.'})

        if role == 'INDIVIDUAL_PROVIDER' and 'provider_profile' not in self.initial_data:
            raise serializers.ValidationError({'provider_profile': 'Provider details are required.'})
        if role == 'THIRD_PARTY_PARTNER':
            partner = data.get('partner_profile')
            if not partner or not partner.get('organization_name'):
                raise serializers.ValidationError({
                    'partner_profile': 'Organization name is required for partners.',
                })

        from django.utils.text import slugify

        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError({'email': 'This email address is already registered.'})

        if not data.get('username'):
            base = slugify(email.split('@')[0]) or 'user'
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base}{counter}'
                counter += 1
            data['username'] = username
        elif User.objects.filter(username=data['username']).exists():
            raise serializers.ValidationError({'username': 'This username is already taken.'})

        return data

    def validate_phone(self, value):
        return super().validate_phone(value)

    def validate_pin_code(self, value):
        return super().validate_pin_code(value)

    def validate_date_of_birth(self, value):
        return super().validate_date_of_birth(value)

    def validate_role(self, value):
        return super().validate_role(value)

    def create(self, validated_data):
        firebase_uid = validated_data.pop('_firebase_uid', None)
        validated_data.pop('password_confirm', None)
        validated_data.pop('terms_accepted')
        validated_data.pop('verification_token', None)
        validated_data.pop('password', None)
        provider_data = validated_data.pop('provider_profile', None)
        partner_data = validated_data.pop('partner_profile', None)
        user = User(**validated_data)
        user.set_unusable_password()
        user.firebase_uid = firebase_uid
        user.is_verified = True
        user.save()
        user._registration_provider_data = provider_data
        user._registration_partner_data = partner_data
        return user
