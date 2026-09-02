from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from .models import Booking


class CustomerCalendarView(APIView):
    def get(self, request):
        bookings = Booking.objects.filter(customer=request.user).order_by('scheduled_start')
        events = []
        for b in bookings:
            events.append({
                'id': b.id,
                'title': b.category.name if b.category else 'Service',
                'start': b.scheduled_start.isoformat() if b.scheduled_start else b.created_at.isoformat(),
                'end': b.scheduled_end.isoformat() if b.scheduled_end else None,
                'status': b.status,
                'slot_status': b.slot_status,
            })
        return Response({'events': events, 'view': request.query_params.get('view', 'list')})


class ProviderCalendarView(APIView):
    def get(self, request):
        bookings = Booking.objects.filter(provider__user=request.user).order_by('scheduled_start')
        events = [{
            'id': b.id,
            'title': f'{b.customer.get_full_name()} - {b.category.name}',
            'start': b.scheduled_start.isoformat() if b.scheduled_start else b.created_at.isoformat(),
            'status': b.status,
        } for b in bookings]
        return Response({'events': events})


class PartnerCalendarView(APIView):
    def get(self, request):
        bookings = Booking.objects.filter(partner__user=request.user).order_by('scheduled_start')
        events = [{
            'id': b.id,
            'title': f'{b.customer.get_full_name()} - {b.category.name}',
            'start': b.scheduled_start.isoformat() if b.scheduled_start else b.created_at.isoformat(),
            'status': b.status,
        } for b in bookings]
        return Response({'events': events})


class AdminCalendarView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Not allowed.'}, status=403)
        bookings = Booking.objects.all().order_by('-scheduled_start')[:100]
        events = [{
            'id': b.id,
            'title': f'#{b.id} - {b.status}',
            'start': b.scheduled_start.isoformat() if b.scheduled_start else b.created_at.isoformat(),
            'status': b.status,
            'customer': b.customer.username,
        } for b in bookings]
        return Response({'events': events})
