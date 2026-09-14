from rest_framework import serializers


class SendEmailOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()


class VerifyEmailOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class LoginSendOTPSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)


class LoginVerifyOTPSerializer(serializers.Serializer):
    login_challenge = serializers.CharField()
    otp = serializers.CharField(min_length=6, max_length=6)


class GoogleAuthSerializer(serializers.Serializer):
    id_token = serializers.CharField()
    role = serializers.ChoiceField(
        choices=['CUSTOMER', 'INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER'],
        required=False,
        default='CUSTOMER',
    )

    def validate_role(self, value):
        from .serializers import RESTRICTED_ROLES
        if value in RESTRICTED_ROLES:
            raise serializers.ValidationError('This role cannot be registered publicly.')
        return value
