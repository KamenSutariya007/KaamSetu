from django.urls import path
from .views import (
    BookingListCreateView, BookingDetailView, BookingStatusView,
    BookingAvailabilityView, AvailableSlotsView, HoldSlotView,
    ConfirmSlotView, ReleaseSlotView, RescheduleView, ReviewCreateView,
    BookingInvoiceView,
)

urlpatterns = [
    path('', BookingListCreateView.as_view()),
    path('<int:pk>/', BookingDetailView.as_view()),
    path('<int:pk>/<str:action>/', BookingStatusView.as_view()),
    path('<int:pk>/availability/', BookingAvailabilityView.as_view()),
    path('<int:pk>/available-slots/', AvailableSlotsView.as_view()),
    path('<int:pk>/hold-slot/', HoldSlotView.as_view()),
    path('<int:pk>/confirm-slot/', ConfirmSlotView.as_view()),
    path('<int:pk>/release-slot/', ReleaseSlotView.as_view()),
    path('<int:pk>/accept-slot/', ConfirmSlotView.as_view()),
    path('<int:pk>/reject-slot/', BookingStatusView.as_view()),
    path('<int:pk>/propose-new-slot/', RescheduleView.as_view()),
    path('<int:pk>/accept-new-slot/', ConfirmSlotView.as_view()),
    path('<int:pk>/reschedule/', RescheduleView.as_view()),
    path('<int:pk>/cancel/', BookingStatusView.as_view()),
    path('<int:pk>/review/', ReviewCreateView.as_view()),
    path('<int:pk>/invoice/', BookingInvoiceView.as_view()),
]
