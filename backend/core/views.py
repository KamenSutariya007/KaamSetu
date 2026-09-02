from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from django.contrib.auth import get_user_model
from django.db.models import Count
from bookings.models import Booking
from bookings.serializers import BookingSerializer
from support.models import SupportTicket
from support.serializers import SupportTicketSerializer
from ai_diagnosis.models import AIDiagnosis
from providers.models import ServiceProvider, ThirdPartyPartner
from services.models import RepairGuide, PriceRange
from tracking.models import TrackingSession
from core.permissions import IsAdmin

User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        popular = Booking.objects.values('category__name').annotate(c=Count('id')).order_by('-c')[:5]
        return Response({
            'users': User.objects.count(),
            'customers': User.objects.filter(role='CUSTOMER').count(),
            'providers': ServiceProvider.objects.filter(is_active=True).count(),
            'partners': ThirdPartyPartner.objects.filter(is_active=True).count(),
            'bookings': Booking.objects.count(),
            'completed_bookings': Booking.objects.filter(status='completed').count(),
            'cancelled_bookings': Booking.objects.filter(status='cancelled').count(),
            'open_tickets': SupportTicket.objects.filter(status__in=['open', 'assigned', 'in_progress', 'escalated']).count(),
            'safety_tickets': SupportTicket.objects.filter(category='safety').exclude(status='closed').count(),
            'ai_diagnoses': AIDiagnosis.objects.count(),
            'active_tracking': TrackingSession.objects.filter(is_active=True).count(),
            'repair_guides': RepairGuide.objects.filter(is_active=True).count(),
            'price_ranges': PriceRange.objects.count(),
            'popular_services': list(popular),
            'demo_data_label': 'Demo Data',
        })


class AdminUsersView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        role = request.query_params.get('role')
        qs = User.objects.all().order_by('-date_joined')[:100]
        if role:
            qs = qs.filter(role=role)
        data = [{
            'id': u.id, 'username': u.username, 'email': u.email,
            'role': u.role, 'first_name': u.first_name, 'last_name': u.last_name,
            'is_verified': u.is_verified,
        } for u in qs]
        return Response({'users': data, 'demo_data_label': 'Demo Data'})


class AdminBookingsView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = BookingSerializer
    queryset = Booking.objects.all().select_related('customer', 'category', 'provider', 'partner').order_by('-created_at')


class AdminTicketsView(generics.ListAPIView):
    permission_classes = [IsAdmin]
    serializer_class = SupportTicketSerializer
    queryset = SupportTicket.objects.all().prefetch_related('messages').order_by('-created_at')
