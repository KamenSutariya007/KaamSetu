from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView, RegisterView, ProfileView,
    PasswordChangeView, ForgotPasswordView, ForgotPasswordSendOTPView,
    ForgotPasswordVerifyOTPView, ResetPasswordView,
    SendEmailOTPView, VerifyEmailOTPView, GoogleAuthView,
    FirebaseAuthView, FirebaseRegisterView,
    LoginSendOTPView, LoginVerifyOTPView,
)
from .pincode import PincodeLookupView

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain'),
    path('login/send-otp/', LoginSendOTPView.as_view(), name='login_send_otp'),
    path('login/verify-otp/', LoginVerifyOTPView.as_view(), name='login_verify_otp'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('email/send-otp/', SendEmailOTPView.as_view(), name='send_email_otp'),
    path('email/verify-otp/', VerifyEmailOTPView.as_view(), name='verify_email_otp'),
    path('pincode/<str:pincode>/', PincodeLookupView.as_view(), name='pincode_lookup'),
    path('google/', GoogleAuthView.as_view(), name='google_auth'),
    path('firebase/', FirebaseAuthView.as_view(), name='firebase_auth'),
    path('firebase/register/', FirebaseRegisterView.as_view(), name='firebase_register'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('password-change/', PasswordChangeView.as_view(), name='password_change'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('forgot-password/send-otp/', ForgotPasswordSendOTPView.as_view(), name='forgot_password_send_otp'),
    path('forgot-password/verify-otp/', ForgotPasswordVerifyOTPView.as_view(), name='forgot_password_verify_otp'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]
