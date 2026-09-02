from django.urls import path
from .views import AdminDashboardView, AdminUsersView, AdminBookingsView, AdminTicketsView

urlpatterns = [
    path('dashboard/', AdminDashboardView.as_view()),
    path('users/', AdminUsersView.as_view()),
    path('bookings/', AdminBookingsView.as_view()),
    path('tickets/', AdminTicketsView.as_view()),
]
