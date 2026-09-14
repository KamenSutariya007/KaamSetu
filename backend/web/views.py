import json
from decimal import Decimal
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.decorators.http import require_POST, require_http_methods
from django.http import JsonResponse, HttpResponse
from django.db.models import Q, Count
from django.utils import timezone

from accounts.models import User, LoginChallenge, EmailVerification, PasswordResetToken
from accounts.email_service import (
    send_password_reset_otp,
    verify_password_reset_otp,
    send_login_otp,
    verify_login_otp,
    normalize_email,
    is_valid_email_format,
    invalidate_verification_for_email,
)
from services.models import ServiceCategory, RepairGuide, PriceRange
from providers.models import ServiceProvider, ThirdPartyPartner, PartnerTechnician, PartnerWarrantyClaim, PartnerSparePart, PartnerQuotation
from bookings.models import Booking, BookingInvoice, Review
from ai_diagnosis.models import AIDiagnosis
from ai_diagnosis.services import analyze_issue
from tracking.models import TrackingSession, LocationUpdate
from support.models import SupportTicket, SupportMessage, SupportAgent
from passport.models import HouseholdAsset
from notifications.models import Notification

from .forms import LoginForm, LoginOTPForm, RegistrationForm, ProfileForm, ApplianceForm, SupportTicketForm
from .i18n import SUPPORTED_LANGUAGES, get_request_translation as _t

# -------------------------------------------------------------------------
# Helper: Role Based Redirection
# -------------------------------------------------------------------------
def get_role_redirect_url(user):
    role = getattr(user, 'role', 'CUSTOMER')
    if role == 'CUSTOMER':
        return '/customer/'
    elif role == 'INDIVIDUAL_PROVIDER':
        return '/provider/'
    elif role == 'THIRD_PARTY_PARTNER':
        return '/partner/'
    elif role in ['SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT']:
        return '/support-desk/'
    elif role == 'ADMIN' or user.is_superuser:
        return '/admin-dashboard/'
    return '/customer/'


def switch_language_view(request):
    lang = request.GET.get('lang', 'en')
    if lang in SUPPORTED_LANGUAGES:
        request.session['kaamsetu_lang'] = lang
        if request.user.is_authenticated:
            request.user.language = lang
            request.user.save(update_fields=['language'])
    referer = request.META.get('HTTP_REFERER', '/')
    response = redirect(referer)
    response.set_cookie('kaamsetu_lang', lang, max_age=365*24*60*60)
    return response


# -------------------------------------------------------------------------
# Authentication Views
# -------------------------------------------------------------------------
def login_view(request):
    if request.user.is_authenticated:
        return redirect(get_role_redirect_url(request.user))

    # Quick demo login trigger via GET query param (e.g. ?demo=customer)
    demo_role = request.GET.get('demo')
    if demo_role:
        role_map = {
            'customer': 'customer',
            'provider': 'provider1',
            'partner': 'partner1',
            'support': 'agent1',
            'admin': 'admin',
        }
        username = role_map.get(demo_role.lower())
        if username:
            user = User.objects.filter(username=username).first()
            if not user:
                # Try finding by role
                target_role = {
                    'customer': 'CUSTOMER',
                    'provider': 'INDIVIDUAL_PROVIDER',
                    'partner': 'THIRD_PARTY_PARTNER',
                    'support': 'SUPPORT_AGENT',
                    'admin': 'ADMIN',
                }.get(demo_role.lower())
                user = User.objects.filter(role=target_role).first()
            if user:
                login(request, user)
                messages.success(request, f'Logged in as demo {user.get_role_display()} ({user.username})')
                return redirect(get_role_redirect_url(user))

    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            username_or_email = form.cleaned_data['username'].strip()
            password = form.cleaned_data['password']
            user = User.objects.filter(Q(username__iexact=username_or_email) | Q(email__iexact=username_or_email)).first()
            if user and user.check_password(password):
                if user.email:
                    result = send_login_otp(user)
                    if result.get('success'):
                        request.session['login_remember_me'] = bool(form.cleaned_data.get('remember_me'))
                        request.session['login_challenge'] = result['login_challenge']
                        messages.success(
                            request,
                            _t(request, 'msgLoginCodeSent', f'A 6-digit login verification code has been sent to {user.email}.', email=user.email)
                        )
                        next_url = request.GET.get('next', '')
                        redirect_url = f'/login/otp/?challenge={result["login_challenge"]}'
                        if next_url:
                            redirect_url += f'&next={next_url}'
                        return redirect(redirect_url)
                    else:
                        messages.error(request, result.get('message', 'Failed to send login verification code. Please try again.'))
                else:
                    # Fallback if account has no email
                    login(request, user)
                    if not form.cleaned_data.get('remember_me'):
                        request.session.set_expiry(0)
                    messages.success(request, f'Welcome back, {user.first_name or user.username}!')
                    next_url = request.GET.get('next')
                    return redirect(next_url or get_role_redirect_url(user))
            else:
                messages.error(request, _t(request, 'msgInvalidLogin', 'Invalid username/email or password.'))
    else:
        form = LoginForm()

    return render(request, 'registration/login.html', {
        'form': form,
    })


def login_otp_view(request):
    challenge_token = (
        request.GET.get('challenge', '')
        or request.POST.get('login_challenge', '')
        or request.session.get('login_challenge', '')
    )

    if not challenge_token:
        messages.error(request, 'No active login session. Please sign in with your email and password.')
        return redirect('login')

    challenge = LoginChallenge.objects.select_related('user').filter(
        token=challenge_token,
        used_at__isnull=True,
        expires_at__gt=timezone.now(),
    ).first()

    if not challenge:
        messages.error(request, _t(request, 'msgSessionExpired', 'Login verification session has expired. Please sign in again.'))
        return redirect('login')

    user = challenge.user

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'resend':
            resend_result = send_login_otp(user)
            if resend_result.get('success'):
                new_token = resend_result['login_challenge']
                request.session['login_challenge'] = new_token
                messages.success(request, _t(request, 'msgNewOtpSent', f'A new verification OTP code has been sent to {user.email}.', email=user.email))
                next_url = request.GET.get('next') or request.POST.get('next', '')
                redirect_url = f'/login/otp/?challenge={new_token}'
                if next_url:
                    redirect_url += f'&next={next_url}'
                return redirect(redirect_url)
            else:
                messages.error(request, resend_result.get('message', 'Failed to resend OTP.'))
                return render(request, 'registration/login_otp.html', {
                    'challenge_token': challenge_token,
                    'email': user.email,
                })

        otp = request.POST.get('otp', '').strip()
        if not otp:
            messages.error(request, _t(request, 'msgEnterOtp', 'Please enter the 6-digit OTP sent to your email.'))
            return render(request, 'registration/login_otp.html', {
                'challenge_token': challenge_token,
                'email': user.email,
            })

        verify_result = verify_login_otp(challenge_token, otp)
        if verify_result.get('success'):
            login(request, user)
            if not request.session.get('login_remember_me'):
                request.session.set_expiry(0)
            request.session.pop('login_challenge', None)
            request.session.pop('login_email', None)
            request.session.pop('login_remember_me', None)
            messages.success(request, _t(request, 'msgWelcomeBack', f'Welcome back, {user.first_name or user.username}!', name=user.first_name or user.username))
            next_url = request.GET.get('next') or request.POST.get('next')
            return redirect(next_url or get_role_redirect_url(user))
        else:
            messages.error(request, _t(request, 'msgOtpInvalid', 'Invalid or expired OTP code.'))
            return render(request, 'registration/login_otp.html', {
                'challenge_token': challenge_token,
                'email': user.email,
                'otp': otp,
            })

    return render(request, 'registration/login_otp.html', {
        'challenge_token': challenge_token,
        'email': user.email,
    })


def logout_view(request):
    logout(request)
    messages.info(request, 'You have been logged out successfully.')
    return redirect('login')


def register_view(request):
    if request.user.is_authenticated:
        return redirect(get_role_redirect_url(request.user))

    categories = ServiceCategory.objects.filter(is_active=True)

    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            email = form.cleaned_data['email'].strip().lower()
            phone = form.cleaned_data['phone'].strip()
            if User.objects.filter(email=email).exists():
                messages.error(request, 'An account with this email address already exists.')
            elif phone and User.objects.filter(phone=phone).exclude(phone='').exists():
                messages.error(request, 'An account with this mobile number already exists.')
            else:
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f'{base_username}{counter}'
                    counter += 1

                role = form.cleaned_data['role']
                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password=form.cleaned_data['password'],
                    first_name=form.cleaned_data['first_name'],
                    last_name=form.cleaned_data['last_name'],
                    phone=form.cleaned_data['phone'],
                    role=role,
                    city=form.cleaned_data.get('city', 'Ahmedabad'),
                    state=form.cleaned_data.get('state', 'Gujarat'),
                    pin_code=form.cleaned_data.get('pin_code', '380001'),
                    address=form.cleaned_data.get('address', ''),
                    referral_code=form.cleaned_data.get('referral_code', ''),
                    is_verified=True,
                )

                if role == 'INDIVIDUAL_PROVIDER':
                    provider = ServiceProvider.objects.create(
                        user=user,
                        experience_years=form.cleaned_data.get('experience_years') or 3,
                        visit_charge=form.cleaned_data.get('visit_charge') or 199,
                        service_radius_km=form.cleaned_data.get('service_radius_km') or 10,
                        bio=form.cleaned_data.get('bio', ''),
                        verification_status='verified',
                    )
                    sel_cats = form.cleaned_data.get('categories')
                    if sel_cats:
                        provider.categories.set(sel_cats)
                    provider.calculate_trust_score()
                    provider.save()

                elif role == 'THIRD_PARTY_PARTNER':
                    ThirdPartyPartner.objects.create(
                        user=user,
                        organization_name=form.cleaned_data.get('organization_name') or f"{user.first_name}'s Services",
                        partner_type=form.cleaned_data.get('partner_type', 'repair_company'),
                        gst_number=form.cleaned_data.get('gst_number', ''),
                        address=form.cleaned_data.get('address', ''),
                        verification_status='verified',
                    )

                login(request, user)
                messages.success(request, 'Registration successful! Welcome to KaamSetu.')
                return redirect(get_role_redirect_url(user))
    else:
        form = RegistrationForm()

    return render(request, 'registration/register.html', {
        'form': form,
        'categories': categories,
    })


def forgot_password_view(request):
    if request.method == 'POST':
        email = normalize_email(request.POST.get('email', ''))
        if not is_valid_email_format(email):
            messages.error(request, _t(request, 'msgValidEmailRequired', 'Please enter a valid email address.'))
            return render(request, 'registration/forgot_password.html', {'email': email})

        user = User.objects.filter(email__iexact=email).first()
        if not user:
            messages.error(request, _t(request, 'msgNoAccountFound', 'No account found with this email address.'))
            return render(request, 'registration/forgot_password.html', {'email': email})

        result = send_password_reset_otp(email)
        if not result.get('success'):
            messages.error(request, result.get('message', 'Failed to send OTP. Please try again in a few moments.'))
            return render(request, 'registration/forgot_password.html', {'email': email})

        messages.success(
            request,
            _t(request, 'msgResetOtpSent', f'A 6-digit OTP verification code has been sent to {email}. Please check your inbox.', email=email)
        )
        return redirect(f'/reset-password/?email={email}')

    email = request.GET.get('email', '').strip().lower()
    return render(request, 'registration/forgot_password.html', {'email': email})


def reset_password_view(request):
    email = normalize_email(request.GET.get('email', '') or request.POST.get('email', ''))

    if request.method == 'POST':
        otp = request.POST.get('otp', '').strip()
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')

        if not email:
            messages.error(request, _t(request, 'msgEmailRequired', 'Email address is required.'))
            return redirect('forgot_password')

        if not otp:
            messages.error(request, _t(request, 'msgEnterOtp', 'Please enter the 6-digit OTP sent to your email.'))
            return render(request, 'registration/reset_password.html', {'email': email})

        if len(otp) != 6 or not otp.isdigit():
            messages.error(request, _t(request, 'msgValidOtpRequired', 'Please enter a valid 6-digit numeric code.'))
            return render(request, 'registration/reset_password.html', {'email': email, 'otp': otp})

        if not password or len(password) < 8:
            messages.error(request, _t(request, 'msgPasswordMinLength', 'New password must be at least 8 characters long.'))
            return render(request, 'registration/reset_password.html', {'email': email, 'otp': otp})

        if password != password_confirm:
            messages.error(request, _t(request, 'msgPasswordsDoNotMatch', 'Passwords do not match.'))
            return render(request, 'registration/reset_password.html', {'email': email, 'otp': otp})

        # Verify the 6-digit OTP against active EmailVerification record
        verify_result = verify_password_reset_otp(email, otp)
        if not verify_result.get('success'):
            messages.error(request, _t(request, 'msgOtpInvalid', 'Invalid or expired OTP code.'))
            return render(request, 'registration/reset_password.html', {'email': email, 'otp': otp})

        # Find user and reset password
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            messages.error(request, _t(request, 'msgUserNotFound', 'User account not found.'))
            return redirect('forgot_password')

        user.set_password(password)
        user.save()

        # Invalidate remaining verifications and tokens
        try:
            PasswordResetToken.objects.filter(user=user, used=False).update(used=True)
        except Exception:
            pass
        invalidate_verification_for_email(email)

        messages.success(
            request,
            _t(request, 'msgPasswordResetSuccess', 'Your password has been reset successfully! Please sign in with your new password.')
        )
        return redirect('login')

    if not email:
        messages.info(request, _t(request, 'msgEnterRegisteredEmail', 'Please enter your registered email to request an OTP.'))
        return redirect('forgot_password')

    return render(request, 'registration/reset_password.html', {'email': email})


# -------------------------------------------------------------------------
# Public Views
# -------------------------------------------------------------------------
def landing_view(request):
    categories = ServiceCategory.objects.filter(is_active=True)[:8]
    guides = RepairGuide.objects.filter(is_active=True)[:3]
    top_providers = ServiceProvider.objects.filter(is_active=True).select_related('user').order_by('-trust_score')[:4]
    return render(request, 'pages/landing.html', {
        'categories': categories,
        'guides': guides,
        'top_providers': top_providers,
    })


def ai_assistant_view(request):
    categories = ServiceCategory.objects.filter(is_active=True)
    result = None

    if request.method == 'POST':
        text = request.POST.get('text', '').strip()
        category_slug = request.POST.get('category', '').strip()
        image = request.FILES.get('image')
        lang = request.session.get('kaamsetu_lang', 'en')

        category = None
        if category_slug:
            category = ServiceCategory.objects.filter(slug=category_slug).first()

        user = request.user if request.user.is_authenticated else None

        try:
            # Server-side Gemini AI diagnosis via existing ai_diagnosis service
            result = analyze_issue(
                text=text,
                image=image,
                category=category,
                language=lang,
                user=user,
            )
        except Exception as e:
            messages.error(request, f'AI Analysis could not complete: {str(e)}')

    return render(request, 'pages/ai_assistant.html', {
        'categories': categories,
        'result': result,
    })


def providers_view(request):
    category_slug = request.GET.get('category', '')
    query = request.GET.get('search', '').strip()
    compare_ids = request.GET.getlist('compare')

    providers_qs = ServiceProvider.objects.filter(is_active=True).select_related('user').prefetch_related('categories')
    partners_qs = ThirdPartyPartner.objects.filter(is_active=True)

    if category_slug:
        providers_qs = providers_qs.filter(categories__slug=category_slug)
        partners_qs = partners_qs.filter(categories__slug=category_slug)

    if query:
        providers_qs = providers_qs.filter(
            Q(user__first_name__icontains=query) |
            Q(user__last_name__icontains=query) |
            Q(bio__icontains=query) |
            Q(categories__name__icontains=query)
        ).distinct()
        partners_qs = partners_qs.filter(
            Q(organization_name__icontains=query) |
            Q(authorized_brands__icontains=query)
        ).distinct()

    providers = list(providers_qs.order_by('-trust_score'))
    partners = list(partners_qs.order_by('-average_rating'))

    compared_providers = []
    if compare_ids:
        compared_providers = ServiceProvider.objects.filter(id__in=compare_ids).select_related('user')

    categories = ServiceCategory.objects.filter(is_active=True)

    return render(request, 'pages/providers.html', {
        'providers': providers,
        'partners': partners,
        'categories': categories,
        'selected_category': category_slug,
        'search_query': query,
        'compared_providers': compared_providers,
    })


def guides_view(request):
    category_slug = request.GET.get('category', '')
    guides_qs = RepairGuide.objects.filter(is_active=True).select_related('category')
    if category_slug:
        guides_qs = guides_qs.filter(category__slug=category_slug)

    categories = ServiceCategory.objects.filter(is_active=True)
    return render(request, 'pages/guides.html', {
        'guides': guides_qs,
        'categories': categories,
        'selected_category': category_slug,
    })


def guide_detail_view(request, slug):
    guide = get_object_or_404(RepairGuide, slug=slug, is_active=True)
    return render(request, 'pages/guide_detail.html', {
        'guide': guide,
    })


def fair_price_view(request):
    categories = ServiceCategory.objects.filter(is_active=True)
    result = None
    quoted_price = request.GET.get('quoted_price') or request.POST.get('quoted_price')
    category_id = request.GET.get('category_id') or request.POST.get('category_id')

    if quoted_price and category_id:
        try:
            q_val = float(quoted_price)
            cat = ServiceCategory.objects.filter(id=category_id).first()
            pr = PriceRange.objects.filter(category_id=category_id, city='Ahmedabad').first()
            if not pr:
                pr = PriceRange.objects.filter(category_id=category_id).first()

            min_range = float(pr.visit_charge_min + pr.labour_min + pr.material_min) if pr else 250.0
            max_range = float(pr.visit_charge_max + pr.labour_max + pr.material_max) if pr else 850.0
            is_overpriced = q_val > max_range

            result = {
                'quoted_price': q_val,
                'typical_range_min': min_range,
                'typical_range_max': max_range,
                'is_overpriced': is_overpriced,
                'demo_price_label': 'Approximate Demo Price — Ahmedabad Zone',
                'category_name': cat.name if cat else 'General Home Repair',
                'visit_charge': {'min': float(pr.visit_charge_min if pr else 150), 'max': float(pr.visit_charge_max if pr else 300)},
                'labour': {'min': float(pr.labour_min if pr else 100), 'max': float(pr.labour_max if pr else 400)},
                'material': {'min': float(pr.material_min if pr else 0), 'max': float(pr.material_max if pr else 150)},
                'transparency_warning': 'Always request an itemized invoice before authorizing replacement parts.',
                'suggestion': 'Quote is significantly higher than usual market rates.' if is_overpriced else 'Quote aligns with typical local rates.',
            }
        except (ValueError, TypeError):
            pass

    return render(request, 'pages/fair_price.html', {
        'categories': categories,
        'result': result,
        'quoted_price': quoted_price or '',
        'selected_category_id': int(category_id) if category_id else None,
    })


DEFAULT_FAQS = [
    {'question': 'How does AI diagnosis work?', 'answer': 'Upload a photo or describe the issue. Demo AI Mode provides guidance when external AI is unavailable.'},
    {'question': 'Is DIY advice safe?', 'answer': 'We never provide DIY steps for gas leaks, fire, or high-voltage issues.'},
    {'question': 'How do I track my provider?', 'answer': 'After booking is accepted and provider starts travel, use the Track Provider button.'},
    {'question': 'Are prices real?', 'answer': 'Demo prices are labelled Approximate Demo Price.'},
    {'question': 'What is the KaamSetu Guarantee?', 'answer': 'All jobs performed by verified technicians include 7-day workmanship warranty and transparent invoices.'},
]


def support_view(request):
    faqs = DEFAULT_FAQS
    query = request.GET.get('q', '').strip().lower()
    if query:
        faqs = [f for f in DEFAULT_FAQS if query in f['question'].lower() or query in f['answer'].lower()]

    if request.method == 'POST':
        if not request.user.is_authenticated:
            messages.error(request, 'Please login to submit a support ticket.')
            return redirect('login')
        form = SupportTicketForm(request.POST)
        if form.is_valid():
            ticket = form.save(commit=False)
            ticket.customer = request.user
            import uuid
            ticket.ticket_number = f"TKT-{uuid.uuid4().hex[:6].upper()}"
            ticket.save()
            messages.success(request, f'Support ticket #{ticket.ticket_number} created! An agent will respond shortly.')
            return redirect('support')
    else:
        form = SupportTicketForm()

    user_tickets = []
    if request.user.is_authenticated:
        user_tickets = SupportTicket.objects.filter(customer=request.user).order_by('-created_at')[:5]

    return render(request, 'pages/support.html', {
        'faqs': faqs,
        'form': form,
        'user_tickets': user_tickets,
        'search_query': query,
    })


def book_service_view(request):
    if not request.user.is_authenticated:
        messages.info(request, 'Please log in to book a service.')
        return redirect(f'/login/?next=/book/')

    categories = ServiceCategory.objects.filter(is_active=True)
    provider_id = request.GET.get('provider')
    partner_id = request.GET.get('partner')

    provider = None
    partner = None
    if provider_id:
        provider = ServiceProvider.objects.filter(id=provider_id).select_related('user').first()
    if partner_id:
        partner = ThirdPartyPartner.objects.filter(id=partner_id).first()

    if request.method == 'POST':
        category_id = request.POST.get('category')
        category = get_object_or_404(ServiceCategory, id=category_id)
        issue_desc = request.POST.get('issue_description', '').strip()
        address = request.POST.get('address', '').strip() or request.user.address or 'Satellite, Ahmedabad, Gujarat'
        pref_date = request.POST.get('preferred_date') or str(timezone.now().date())
        time_start = request.POST.get('preferred_time_start') or '10:00'
        time_end = request.POST.get('preferred_time_end') or '12:00'
        flexible = request.POST.get('flexible_timing') == 'on'

        booking = Booking.objects.create(
            customer=request.user,
            category=category,
            provider=provider,
            partner=partner,
            issue_description=issue_desc or f"Repair request for {category.name}",
            address=address,
            latitude=request.user.latitude or Decimal('23.022500'),
            longitude=request.user.longitude or Decimal('72.571400'),
            preferred_date=pref_date,
            preferred_time_start=time_start,
            preferred_time_end=time_end,
            flexible_timing=flexible,
            estimated_price_min=Decimal('200.00'),
            estimated_price_max=Decimal('800.00'),
            status='requested',
        )
        messages.success(request, f'Booking #{booking.id} placed successfully!')
        return redirect(f'/customer/bookings/{booking.id}/')

    return render(request, 'pages/book_service.html', {
        'categories': categories,
        'provider': provider,
        'partner': partner,
    })


# -------------------------------------------------------------------------
# Customer Views
# -------------------------------------------------------------------------
@login_required
def customer_dashboard_view(request):
    bookings = Booking.objects.filter(customer=request.user).select_related('category', 'provider__user', 'partner').order_by('-created_at')
    active_bookings = [b for b in bookings if b.status not in ['completed', 'cancelled', 'rejected']]
    completed_bookings = [b for b in bookings if b.status == 'completed']
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:4]

    return render(request, 'customer/dashboard.html', {
        'active_bookings': active_bookings,
        'completed_bookings': completed_bookings,
        'total_bookings_count': len(bookings),
        'notifications': notifications,
    })


@login_required
def customer_bookings_view(request):
    status_filter = request.GET.get('status', 'all')
    bookings_qs = Booking.objects.filter(customer=request.user).select_related('category', 'provider__user', 'partner').order_by('-created_at')

    if status_filter == 'upcoming':
        bookings_qs = bookings_qs.exclude(status__in=['completed', 'cancelled', 'rejected'])
    elif status_filter == 'completed':
        bookings_qs = bookings_qs.filter(status='completed')
    elif status_filter == 'cancelled':
        bookings_qs = bookings_qs.filter(status__in=['cancelled', 'rejected'])

    return render(request, 'customer/bookings.html', {
        'bookings': bookings_qs,
        'status_filter': status_filter,
    })


@login_required
def booking_detail_view(request, booking_id):
    booking = get_object_or_404(Booking.objects.select_related('category', 'provider__user', 'partner', 'technician'), id=booking_id)

    # Permit customer, assigned provider, partner, or staff
    if not (booking.customer == request.user or
            (booking.provider and booking.provider.user == request.user) or
            (booking.partner and booking.partner.user == request.user) or
            request.user.role in ['ADMIN', 'SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT'] or request.user.is_superuser):
        messages.error(request, 'You do not have permission to view this booking.')
        return redirect('customer_dashboard')

    if request.method == 'POST':
        action = request.POST.get('action')
        if action == 'cancel' and booking.customer == request.user:
            booking.status = 'cancelled'
            booking.save()
            messages.info(request, 'Booking has been cancelled.')
            return redirect(f'/customer/bookings/{booking.id}/')
        elif action == 'review' and booking.customer == request.user:
            rating = int(request.POST.get('rating', 5))
            comment = request.POST.get('comment', '').strip()
            Review.objects.create(
                booking=booking,
                provider=booking.provider,
                partner=booking.partner,
                customer=request.user,
                rating=rating,
                comment=comment,
            )
            messages.success(request, 'Thank you for your rating and feedback!')
            return redirect(f'/customer/bookings/{booking.id}/')

    review = Review.objects.filter(booking=booking).first()
    invoice = BookingInvoice.objects.filter(booking=booking).first()

    return render(request, 'customer/booking_detail.html', {
        'booking': booking,
        'review': review,
        'invoice': invoice,
    })


@login_required
def tracking_view(request, booking_id):
    booking = get_object_or_404(Booking, id=booking_id)
    session = TrackingSession.objects.filter(booking=booking).first()
    if not session:
        cust_lat = float(booking.latitude or Decimal('23.0225'))
        cust_lng = float(booking.longitude or Decimal('72.5714'))
        provider_user = booking.provider.user if booking.provider else (booking.partner.user if booking.partner else request.user)
        session = TrackingSession.objects.create(
            booking=booking,
            provider=provider_user,
            customer_latitude=Decimal(str(round(cust_lat, 6))),
            customer_longitude=Decimal(str(round(cust_lng, 6))),
            last_latitude=Decimal(str(round(cust_lat + 0.015, 6))),
            last_longitude=Decimal(str(round(cust_lng - 0.018, 6))),
            eta_minutes=12,
            distance_km=Decimal('3.4'),
            is_active=True,
            is_demo_mode=True,
        )

    return render(request, 'customer/track.html', {
        'booking': booking,
        'tracking': session,
    })


@login_required
def passport_view(request):
    assets = HouseholdAsset.objects.filter(owner=request.user).order_by('-created_at')

    if request.method == 'POST':
        form = ApplianceForm(request.POST)
        if form.is_valid():
            asset = form.save(commit=False)
            asset.owner = request.user
            asset.save()
            messages.success(request, f'Added {asset.brand} {asset.get_asset_type_display()} to your Home Passport.')
            return redirect('passport')
    else:
        form = ApplianceForm()

    return render(request, 'customer/passport.html', {
        'assets': assets,
        'form': form,
    })


@login_required
def delete_asset_view(request, asset_id):
    asset = get_object_or_404(HouseholdAsset, id=asset_id, owner=request.user)
    asset.delete()
    messages.info(request, 'Appliance removed from Home Passport.')
    return redirect('passport')


@login_required
def notifications_view(request):
    notifications = Notification.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'customer/notifications.html', {
        'notifications': notifications,
    })


@login_required
def mark_notifications_read_view(request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    messages.success(request, 'All notifications marked as read.')
    return redirect('notifications')


@login_required
def profile_view(request):
    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, 'Your profile has been updated successfully.')
            return redirect('profile')
    else:
        form = ProfileForm(instance=request.user)

    return render(request, 'customer/profile.html', {
        'form': form,
    })


# -------------------------------------------------------------------------
# Provider Views
# -------------------------------------------------------------------------
@login_required
def provider_dashboard_view(request):
    provider = getattr(request.user, 'provider_profile', None)
    if not provider and request.user.role != 'INDIVIDUAL_PROVIDER' and not request.user.is_superuser:
        messages.error(request, 'Only registered service providers can access the provider portal.')
        return redirect('customer_dashboard')

    if not provider:
        # Create a basic profile if user role is INDIVIDUAL_PROVIDER but profile missing
        provider, _ = ServiceProvider.objects.get_or_create(user=request.user, defaults={'verification_status': 'verified'})

    tab = request.GET.get('tab', 'overview')
    bookings = Booking.objects.filter(
        Q(provider=provider) | Q(category__in=provider.categories.all(), provider__isnull=True)
    ).select_related('category', 'customer').order_by('-created_at')

    new_requests = [b for b in bookings if b.status == 'requested']
    active_jobs = [b for b in bookings if b.status in ['accepted', 'preparing', 'on_the_way', 'arrived', 'started']]
    completed_jobs = [b for b in bookings if b.status == 'completed']

    return render(request, 'provider/dashboard.html', {
        'provider': provider,
        'tab': tab,
        'new_requests': new_requests,
        'active_jobs': active_jobs,
        'completed_jobs': completed_jobs,
        'all_bookings': bookings,
    })


@login_required
def provider_job_action_view(request, booking_id, action):
    booking = get_object_or_404(Booking, id=booking_id)
    provider = getattr(request.user, 'provider_profile', None)

    action_status_map = {
        'accept': 'accepted',
        'reject-slot': 'rejected',
        'prepare': 'preparing',
        'start-travel': 'on_the_way',
        'arrive': 'arrived',
        'start-job': 'started',
        'complete': 'completed',
    }

    new_status = action_status_map.get(action)
    if new_status:
        if action == 'complete':
            otp = request.POST.get('otp', '').strip()
            # If OTP provided or demo, complete
            booking.status = 'completed'
            booking.completed_at = timezone.now()
            booking.save()
            if provider:
                provider.completed_jobs += 1
                provider.calculate_trust_score()
                provider.save()
            messages.success(request, f'Job #{booking.id} completed successfully!')
        else:
            booking.status = new_status
            if action == 'accept' and not booking.provider and provider:
                booking.provider = provider
            booking.save()
            messages.success(request, f'Job #{booking.id} status updated to {new_status}.')

    return redirect('/provider/')


# -------------------------------------------------------------------------
# Partner Views
# -------------------------------------------------------------------------
@login_required
def partner_dashboard_view(request):
    partner = getattr(request.user, 'partner_profile', None)
    if not partner and request.user.role != 'THIRD_PARTY_PARTNER' and not request.user.is_superuser:
        messages.error(request, 'Only third-party partner companies can access this dashboard.')
        return redirect('customer_dashboard')

    if not partner:
        partner, _ = ThirdPartyPartner.objects.get_or_create(user=request.user, defaults={'organization_name': request.user.first_name or 'Partner Services'})

    tab = request.GET.get('tab', 'overview')
    bookings = Booking.objects.filter(partner=partner).select_related('category', 'customer', 'technician').order_by('-created_at')
    technicians = PartnerTechnician.objects.filter(partner=partner)
    warranty_claims = PartnerWarrantyClaim.objects.filter(partner=partner).order_by('-created_at')
    spare_parts = PartnerSparePart.objects.filter(partner=partner)
    quotations = PartnerQuotation.objects.filter(partner=partner).order_by('-created_at')

    return render(request, 'partner/dashboard.html', {
        'partner': partner,
        'tab': tab,
        'bookings': bookings,
        'technicians': technicians,
        'warranty_claims': warranty_claims,
        'spare_parts': spare_parts,
        'quotations': quotations,
    })


@login_required
def partner_assign_tech_view(request, booking_id):
    partner = getattr(request.user, 'partner_profile', None)
    booking = get_object_or_404(Booking, id=booking_id)
    tech_id = request.POST.get('technician_id')
    if tech_id:
        tech = get_object_or_404(PartnerTechnician, id=tech_id, partner=partner)
        booking.technician = tech
        booking.status = 'accepted'
        booking.save()
        messages.success(request, f'Assigned technician {tech.name} to Job #{booking.id}.')
    return redirect('/partner/')


# -------------------------------------------------------------------------
# Support Agent Desk Views
# -------------------------------------------------------------------------
@login_required
def support_desk_view(request):
    if request.user.role not in ['SUPPORT_AGENT', 'SENIOR_SUPPORT_AGENT', 'ADMIN'] and not request.user.is_superuser:
        messages.error(request, 'Access restricted to support desk agents.')
        return redirect('customer_dashboard')

    tickets = SupportTicket.objects.all().select_related('customer').order_by('-created_at')
    selected_id = request.GET.get('ticket')
    selected_ticket = None
    if selected_id:
        selected_ticket = SupportTicket.objects.filter(id=selected_id).first()
    elif tickets.exists():
        selected_ticket = tickets.first()

    return render(request, 'support/desk.html', {
        'tickets': tickets,
        'selected_ticket': selected_ticket,
    })


@login_required
def support_ticket_action_view(request, ticket_id):
    ticket = get_object_or_404(SupportTicket, id=ticket_id)
    action = request.POST.get('action')
    reply_text = request.POST.get('reply', '').strip()

    if reply_text:
        SupportMessage.objects.create(
            ticket=ticket,
            sender=request.user,
            message=reply_text,
            is_internal=request.POST.get('is_internal') == 'on',
        )
        messages.success(request, 'Reply posted.')

    if action == 'assign':
        ticket.assigned_agent = request.user
        ticket.status = 'in_progress'
        ticket.save()
        messages.success(request, f'Ticket #{ticket.ticket_number} assigned to you.')
    elif action == 'resolve':
        ticket.status = 'resolved'
        ticket.save()
        messages.success(request, f'Ticket #{ticket.ticket_number} marked as resolved.')

    return redirect(f'/support-desk/?ticket={ticket.id}')


# -------------------------------------------------------------------------
# Admin Dashboard Views
# -------------------------------------------------------------------------
def get_system_stats():
    total_completed = Booking.objects.filter(status='completed').count()
    return {
        'total_users': User.objects.count(),
        'total_customers': User.objects.filter(role='CUSTOMER').count(),
        'total_providers': ServiceProvider.objects.filter(is_active=True).count(),
        'total_partners': ThirdPartyPartner.objects.filter(is_active=True).count(),
        'total_bookings': Booking.objects.count(),
        'completed_bookings': total_completed,
        'active_bookings': Booking.objects.exclude(status__in=['completed', 'cancelled', 'rejected']).count(),
        'open_tickets': SupportTicket.objects.filter(status__in=['open', 'assigned', 'in_progress', 'escalated']).count(),
        'total_gmv': total_completed * 450,
    }


@login_required
def admin_dashboard_view(request):
    if request.user.role != 'ADMIN' and not request.user.is_superuser:
        messages.error(request, 'Administrator privileges required.')
        return redirect('customer_dashboard')

    stats = get_system_stats()
    recent_bookings = Booking.objects.all().select_related('customer', 'category').order_by('-created_at')[:8]
    open_tickets = SupportTicket.objects.filter(status__in=['open', 'in_progress']).order_by('-created_at')[:5]

    return render(request, 'admin_panel/dashboard.html', {
        'stats': stats,
        'recent_bookings': recent_bookings,
        'open_tickets': open_tickets,
    })


@login_required
def admin_bookings_view(request):
    if request.user.role != 'ADMIN' and not request.user.is_superuser:
        messages.error(request, 'Administrator privileges required.')
        return redirect('customer_dashboard')

    status = request.GET.get('status', '')
    query = request.GET.get('q', '').strip()
    bookings = Booking.objects.all().select_related('customer', 'provider__user', 'partner', 'category').order_by('-created_at')

    if status:
        bookings = bookings.filter(status=status)
    if query:
        bookings = bookings.filter(
            Q(id__icontains=query) |
            Q(customer__first_name__icontains=query) |
            Q(customer__last_name__icontains=query) |
            Q(issue_description__icontains=query)
        )

    return render(request, 'admin_panel/bookings.html', {
        'bookings': bookings[:50],
        'selected_status': status,
        'query': query,
    })
