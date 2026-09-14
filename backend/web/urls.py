from django.urls import path
from . import views

urlpatterns = [
    # Public & Marketing
    path('', views.landing_view, name='landing'),
    path('switch-language/', views.switch_language_view, name='switch_language'),
    path('ai-assistant/', views.ai_assistant_view, name='ai_assistant'),
    path('providers/', views.providers_view, name='providers'),
    path('guides/', views.guides_view, name='guides'),
    path('guides/<slug:slug>/', views.guide_detail_view, name='guide_detail'),
    path('support/', views.support_view, name='support'),
    path('fair-price/', views.fair_price_view, name='fair_price'),
    path('book/', views.book_service_view, name='book_service'),

    # Auth
    path('login/', views.login_view, name='login'),
    path('login/otp/', views.login_otp_view, name='login_otp'),
    path('logout/', views.logout_view, name='logout'),
    path('register/', views.register_view, name='register'),
    path('forgot-password/', views.forgot_password_view, name='forgot_password'),
    path('reset-password/', views.reset_password_view, name='reset_password'),

    # Customer
    path('customer/', views.customer_dashboard_view, name='customer_dashboard'),
    path('customer/bookings/', views.customer_bookings_view, name='customer_bookings'),
    path('customer/bookings/<int:booking_id>/', views.booking_detail_view, name='booking_detail'),
    path('customer/bookings/<int:booking_id>/track/', views.tracking_view, name='booking_track'),
    path('customer/track/<int:booking_id>/', views.tracking_view, name='tracking'),
    path('customer/passport/', views.passport_view, name='passport'),
    path('customer/passport/delete/<int:asset_id>/', views.delete_asset_view, name='delete_asset'),
    path('customer/notifications/', views.notifications_view, name='notifications'),
    path('customer/notifications/mark-read/', views.mark_notifications_read_view, name='mark_notifications_read'),
    path('profile/', views.profile_view, name='profile'),
    path('customer/profile/', views.profile_view, name='customer_profile'),

    # Provider
    path('provider/', views.provider_dashboard_view, name='provider_dashboard'),
    path('provider/jobs/', views.provider_dashboard_view, name='provider_jobs'),
    path('provider/calendar/', views.provider_dashboard_view, name='provider_calendar'),
    path('provider/job-action/<int:booking_id>/<str:action>/', views.provider_job_action_view, name='provider_job_action'),
    path('provider/profile/', views.profile_view, name='provider_profile'),

    # Partner
    path('partner/', views.partner_dashboard_view, name='partner_dashboard'),
    path('partner/jobs/', views.partner_dashboard_view, name='partner_jobs'),
    path('partner/assign-tech/<int:booking_id>/', views.partner_assign_tech_view, name='partner_assign_tech'),
    path('partner/profile/', views.profile_view, name='partner_profile'),

    # Support Desk
    path('support-desk/', views.support_desk_view, name='support_desk'),
    path('support-desk/action/<int:ticket_id>/', views.support_ticket_action_view, name='support_ticket_action'),
    path('support-desk/profile/', views.profile_view, name='support_profile'),

    # Admin
    path('admin-dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    path('admin-dashboard/bookings/', views.admin_bookings_view, name='admin_bookings'),
    path('admin-panel/bookings/', views.admin_bookings_view, name='admin_panel_bookings'),
    path('admin/bookings/', views.admin_bookings_view, name='admin_bookings_alt'),
    path('admin-dashboard/profile/', views.profile_view, name='admin_profile'),
]
