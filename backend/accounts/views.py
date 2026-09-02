import re
import secrets
from datetime import timedelta, time as dt_time

from django.utils import timezone
from django.contrib.auth import get_user_model
from django.conf import settings
from rest_framework import status, generics, permissions, serializers
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserSerializer, RegisterSerializer, ProfileUpdateSerializer,
    PasswordChangeSerializer, ForgotPasswordSerializer,
)
from .email_serializers import (
    SendEmailOTPSerializer, VerifyEmailOTPSerializer, GoogleAuthSerializer,
    LoginSendOTPSerializer, LoginVerifyOTPSerializer,
)
from .firebase_serializers import FirebaseAuthSerializer, FirebaseRegisterSerializer
from .email_service import (
    send_email_otp, verify_email_otp, normalize_email, email_service_configured,
    send_login_otp, verify_login_otp,
    send_password_reset_otp, verify_password_reset_otp,
)
from .google_auth import verify_google_id_token
from . import firebase_auth
from .models import PasswordResetToken
from providers.models import ServiceProvider, ThirdPartyPartner, ProviderAvailability
from services.models import ServiceCategory

User = get_user_model()


def resolve_user_from_login_id(login_id):
    """Find user by email, phone, or username (login identifier)."""
    login_id = (login_id or '').strip()
    if not login_id:
        return None
    if '@' in login_id:
        return User.objects.filter(email__iexact=login_id).first()
    digits = re.sub(r'\D', '', login_id)
    if len(digits) == 10:
        user = User.objects.filter(phone=digits).first()
        if user:
            return user
    elif len(digits) == 12 and digits.startswith('91'):
        user = User.objects.filter(phone=digits[2:]).first()
        if user:
            return user
    return User.objects.filter(username__iexact=login_id).first()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def _resolve_username(self, login_id):
        login_id = (login_id or '').strip()
        if not login_id:
            return login_id
        if '@' in login_id:
            user = User.objects.filter(email__iexact=login_id).first()
            if user:
                return user.username
            return login_id
        digits = re.sub(r'\D', '', login_id)
        if len(digits) == 10:
            user = User.objects.filter(phone=digits).first()
            if user:
                return user.username
        elif len(digits) == 12 and digits.startswith('91'):
            user = User.objects.filter(phone=digits[2:]).first()
            if user:
                return user.username
        return login_id

    def validate(self, attrs):
        username_field = self.username_field
        attrs[username_field] = self._resolve_username(attrs.get(username_field))
        try:
            data = super().validate(attrs)
        except serializers.ValidationError:
            raise serializers.ValidationError({
                'detail': 'Incorrect email or password. Please try again.',
            })
        if not self.user.is_active:
            raise serializers.ValidationError({
                'detail': 'This account is inactive. Please contact support.',
            })
        if getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False) and not self.user.is_verified:
            raise serializers.ValidationError({
                'detail': 'Please verify your email address before logging in.',
            })
        data['user'] = UserSerializer(self.user).data
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class LoginSendOTPView(APIView):
    """Step 1: verify password, then email a login OTP."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        login_id = serializer.validated_data['username']
        password = serializer.validated_data['password']
        login_id = login_id.strip()

        user = None
        if '@' in login_id:
            candidates = list(User.objects.filter(email__iexact=login_id).order_by('-date_joined'))
            if not candidates:
                return Response(
                    {
                        'detail': 'No account found with this email or phone. Please register first.',
                        'error': 'account_not_found',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            user = next((u for u in candidates if u.check_password(password)), None)
            if not user:
                return Response(
                    {
                        'detail': 'Incorrect password. Try again or use Forgot Password.',
                        'error': 'invalid_password',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            user = resolve_user_from_login_id(login_id)
            if not user:
                return Response(
                    {
                        'detail': 'No account found with this email or phone. Please register first.',
                        'error': 'account_not_found',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if not user.check_password(password):
                return Response(
                    {
                        'detail': 'Incorrect password. Try again or use Forgot Password.',
                        'error': 'invalid_password',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )
        if not user.is_active:
            return Response(
                {'detail': 'This account is inactive. Please contact support.', 'error': 'inactive'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if getattr(settings, 'EMAIL_VERIFICATION_REQUIRED', False) and not user.is_verified:
            return Response(
                {'detail': 'Please verify your email address before logging in.', 'error': 'unverified'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = send_login_otp(user)
        if not result.get('success'):
            status_code = status.HTTP_400_BAD_REQUEST
            if result.get('error') == 'not_configured':
                status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            elif result.get('error') == 'rate_limited':
                status_code = status.HTTP_429_TOO_MANY_REQUESTS
            elif result.get('error') == 'resend_cooldown':
                status_code = status.HTTP_429_TOO_MANY_REQUESTS
            return Response(result, status=status_code)

        return Response({
            'success': True,
            'message': result.get('message', 'Verification code sent.'),
            'login_challenge': result['login_challenge'],
            'email_masked': result.get('email_masked'),
            'retry_after_seconds': result.get('retry_after_seconds', 0),
        })


class LoginVerifyOTPView(APIView):
    """Step 2: verify email OTP and issue JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginVerifyOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = verify_login_otp(
            serializer.validated_data['login_challenge'],
            serializer.validated_data['otp'],
        )
        if not result.get('success'):
            status_code = status.HTTP_400_BAD_REQUEST
            if result.get('error') == 'too_many_attempts':
                status_code = status.HTTP_429_TOO_MANY_REQUESTS
            return Response(result, status=status_code)

        user = result['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'success': True,
            'message': 'Signed in successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        })


def _parse_time(value, fallback):
    if isinstance(value, dt_time):
        return value
    if isinstance(value, str) and value:
        parts = value.split(':')
        return dt_time(int(parts[0]), int(parts[1]))
    return fallback


def _create_provider_profile(user, data):
    provider = ServiceProvider.objects.create(
        user=user,
        bio=data.get('bio', ''),
        experience_years=data.get('experience_years', 0),
        visit_charge=data.get('visit_charge', 0),
        service_radius_km=data.get('service_radius_km', 10),
        base_latitude=user.latitude,
        base_longitude=user.longitude,
    )
    category_ids = data.get('category_ids') or []
    if category_ids:
        provider.categories.set(ServiceCategory.objects.filter(id__in=category_ids))
    working_days = data.get('working_days') or [0, 1, 2, 3, 4, 5]
    start = _parse_time(data.get('work_start'), dt_time(9, 0))
    end = _parse_time(data.get('work_end'), dt_time(18, 0))
    for day in working_days:
        ProviderAvailability.objects.create(
            provider=provider,
            day_of_week=day,
            start_time=start,
            end_time=end,
            is_available=True,
        )
    return provider


def _create_partner_profile(user, data):
    contact = data.get('contact_person') or user.get_full_name() or user.username
    partner = ThirdPartyPartner.objects.create(
        user=user,
        organization_name=data['organization_name'],
        partner_type=data.get('partner_type', 'repair_company'),
        authorized_brands=data.get('authorized_brands') or [],
        address=data.get('business_address') or user.address,
        latitude=user.latitude,
        longitude=user.longitude,
        gst_number=data.get('gst_number', ''),
        contact_person=contact,
    )
    category_ids = data.get('category_ids') or []
    if category_ids:
        partner.categories.set(ServiceCategory.objects.filter(id__in=category_ids))
    return partner


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        role = user.role
        provider_data = getattr(user, '_registration_provider_data', None)
        partner_data = getattr(user, '_registration_partner_data', None)
        if role == 'INDIVIDUAL_PROVIDER':
            _create_provider_profile(user, provider_data or {})
        elif role == 'THIRD_PARTY_PARTNER':
            _create_partner_profile(user, partner_data or {
                'organization_name': f"{user.get_full_name() or user.username}'s Organization",
            })
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'detail': 'Account created successfully.',
        }, status=status.HTTP_201_CREATED)


class SendEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SendEmailOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = send_email_otp(serializer.validated_data['email'])
        if not result.get('success'):
            status_code = status.HTTP_400_BAD_REQUEST
            if result.get('error') == 'not_configured':
                status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            elif result.get('error') == 'rate_limited':
                status_code = status.HTTP_429_TOO_MANY_REQUESTS
            return Response(result, status=status_code)
        return Response(result)


class VerifyEmailOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = verify_email_otp(
            serializer.validated_data['email'],
            serializer.validated_data['otp'],
        )
        if not result.get('success'):
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response(result)


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        id_token_value = serializer.validated_data['id_token']
        role = serializer.validated_data.get('role', 'CUSTOMER')

        identity = verify_google_id_token(id_token_value)
        if not identity:
            return Response(
                {'detail': 'Invalid or expired Google authentication token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = identity['email']
        google_id = identity['google_id']
        user = User.objects.filter(google_id=google_id).first() or User.objects.filter(email__iexact=email).first()
        is_new_user = False

        if user:
            if not user.is_active:
                return Response({'detail': 'This account is inactive.'}, status=status.HTTP_403_FORBIDDEN)
            if not user.google_id and google_id:
                user.google_id = google_id
                user.is_verified = True
                user.save(update_fields=['google_id', 'is_verified', 'updated_at'])
        else:
            is_new_user = True
            base = email.split('@')[0].replace('.', '')[:20] or 'user'
            username = base
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f'{base}{counter}'
                counter += 1
            user = User.objects.create(
                username=username,
                email=email,
                first_name=identity.get('first_name', ''),
                last_name=identity.get('last_name', ''),
                role=role,
                google_id=google_id,
                is_verified=True,
            )
            user.set_unusable_password()
            user.save()

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'detail': 'Signed in with Google successfully.',
            'is_new_user': is_new_user,
        })


def _link_firebase_user(user, identity):
    updates = []
    if identity.get('uid') and user.firebase_uid != identity['uid']:
        user.firebase_uid = identity['uid']
        updates.append('firebase_uid')
    if identity.get('email_verified') and not user.is_verified:
        user.is_verified = True
        updates.append('is_verified')
    if updates:
        updates.append('updated_at')
        user.save(update_fields=updates)


class FirebaseAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        if not firebase_auth.firebase_configured():
            return Response(
                {'detail': 'Firebase authentication is not configured.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        serializer = FirebaseAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        identity = firebase_auth.verify_firebase_id_token(serializer.validated_data['id_token'])
        if not identity:
            return Response(
                {'detail': 'Invalid or expired Firebase authentication token.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not identity.get('email_verified'):
            return Response(
                {'detail': 'Please verify your email address before logging in.', 'code': 'email_not_verified'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        uid = identity['uid']
        email = identity['email']
        user = User.objects.filter(firebase_uid=uid).first() or User.objects.filter(email__iexact=email).first()
        if not user:
            return Response(
                {'detail': 'No account found. Please complete registration first.', 'code': 'not_registered'},
                status=status.HTTP_404_NOT_FOUND,
            )
        if not user.is_active:
            return Response({'detail': 'This account is inactive.'}, status=status.HTTP_403_FORBIDDEN)

        _link_firebase_user(user, identity)
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'detail': 'Signed in successfully.',
        })


class FirebaseRegisterView(generics.CreateAPIView):
    serializer_class = FirebaseRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        if not firebase_auth.firebase_configured():
            return Response(
                {'detail': 'Firebase authentication is not configured on the server.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        id_token = (request.data.get('id_token') or '').strip()
        identity = firebase_auth.verify_firebase_id_token(id_token) if id_token else None
        if not identity:
            return Response(
                {
                    'detail': 'Invalid or expired Firebase token. Please try registering again.',
                    'id_token': ['Invalid or expired Firebase token.'],
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not identity.get('email_verified'):
            return Response(
                {
                    'detail': 'Please verify your email address before creating your account.',
                    'code': 'email_not_verified',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        email = identity['email']
        uid = identity['uid']
        existing = User.objects.filter(firebase_uid=uid).first() or User.objects.filter(email__iexact=email).first()
        if existing:
            if existing.firebase_uid and existing.firebase_uid != uid:
                return Response(
                    {'email': ['This email address is already registered with another account.']},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            _link_firebase_user(existing, identity)
            refresh = RefreshToken.for_user(existing)
            return Response({
                'user': UserSerializer(existing).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'detail': 'Signed in successfully.',
            }, status=status.HTTP_200_OK)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        role = user.role
        provider_data = getattr(user, '_registration_provider_data', None)
        partner_data = getattr(user, '_registration_partner_data', None)
        if role == 'INDIVIDUAL_PROVIDER':
            _create_provider_profile(user, provider_data or {})
        elif role == 'THIRD_PARTY_PARTNER':
            _create_partner_profile(user, partner_data or {
                'organization_name': f"{user.get_full_name() or user.username}'s Organization",
            })
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'detail': 'Account created successfully.',
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileUpdateSerializer

    def get_object(self):
        return self.request.user

    def get(self, request, *args, **kwargs):
        return Response(UserSerializer(request.user).data)

    def patch(self, request, *args, **kwargs):
        serializer = ProfileUpdateSerializer(request.user, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(UserSerializer(request.user).data)


class PasswordChangeView(APIView):
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        if not request.user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password updated successfully.'})


class ForgotPasswordSendOTPView(APIView):
    """Step 1: email OTP + optional reset link."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = normalize_email(serializer.validated_data['email'])

        from core.network import get_public_frontend_url
        result = send_password_reset_otp(email, link_base=get_public_frontend_url())
        if not result.get('success'):
            status_code = status.HTTP_429_TOO_MANY_REQUESTS if result.get('error') == 'rate_limited' else status.HTTP_400_BAD_REQUEST
            if result.get('error') == 'send_failed':
                status_code = status.HTTP_503_SERVICE_UNAVAILABLE
            return Response(
                {'detail': result.get('message'), 'error': result.get('error'), **result},
                status=status_code,
            )

        resp = {
            'detail': result.get('message'),
            'email_masked': result.get('email_masked', ''),
            'retry_after_seconds': result.get('retry_after_seconds', 60),
        }
        if result.get('dev_reset_url'):
            resp['dev_reset_url'] = result['dev_reset_url']
        return Response(resp)


class ForgotPasswordVerifyOTPView(APIView):
    """Step 2: verify OTP → reset token for new password."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = normalize_email(request.data.get('email', ''))
        otp = (request.data.get('otp') or '').strip()
        result = verify_password_reset_otp(email, otp)
        if not result.get('success'):
            code = result.get('error', '')
            status_code = status.HTTP_400_BAD_REQUEST
            if code in ('expired', 'too_many_attempts'):
                status_code = status.HTTP_400_BAD_REQUEST
            return Response(result, status=status_code)
        return Response({
            'detail': result.get('message'),
            'reset_token': result.get('reset_token'),
        })


class ForgotPasswordView(APIView):
    """Legacy — forwards to OTP send."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        return ForgotPasswordSendOTPView().post(request)


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = (request.data.get('token') or '').strip()
        new_password = request.data.get('new_password', '')
        if not token or not new_password:
            return Response({'detail': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
        record = PasswordResetToken.objects.filter(token=token, used=False, expires_at__gt=timezone.now()).select_related('user').first()
        if not record:
            return Response({'detail': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError as DjangoValidationError
        try:
            validate_password(new_password, record.user)
        except DjangoValidationError as exc:
            return Response({'new_password': list(exc.messages)}, status=status.HTTP_400_BAD_REQUEST)
        record.user.set_password(new_password)
        record.user.save(update_fields=['password'])
        record.used = True
        record.save(update_fields=['used'])
        return Response({'detail': 'Password reset successfully.'})
