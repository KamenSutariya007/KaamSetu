from django.urls import path
from .calendar_views import (
    CustomerCalendarView, ProviderCalendarView,
    PartnerCalendarView, AdminCalendarView,
)

urlpatterns = [
    path('customer/', CustomerCalendarView.as_view()),
    path('provider/', ProviderCalendarView.as_view()),
    path('partner/', PartnerCalendarView.as_view()),
    path('admin/', AdminCalendarView.as_view()),
]
