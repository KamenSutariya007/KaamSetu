from django.utils import timezone
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

from bookings.models import Booking
from .models import TrackingSession, LocationUpdate
from .serializers import TrackingSessionSerializer

DEMO_ROUTE = [
    (23.0225, 72.5714), (23.0230, 72.5720), (23.0235, 72.5725),
    (23.0240, 72.5730), (23.0245, 72.5735), (23.0250, 72.5740),
]


def _can_track(user, booking):
    if user.role == 'ADMIN':
        return True
    if booking.customer == user:
        return True
    if booking.provider and booking.provider.user == user:
        return True
    if booking.partner and booking.partner.user == user:
        return True
    return False


class StartTrackingView(APIView):
    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, pk=booking_id)
        if not _can_track(request.user, booking):
            return Response({'detail': 'Not allowed.'}, status=403)
        if request.user.role in ('INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER'):
            if booking.status not in ('accepted', 'preparing'):
                return Response({'detail': 'Start travel only after booking accepted.'}, status=400)
        elif booking.status not in ('accepted', 'preparing', 'on_the_way', 'arrived'):
            return Response({'detail': 'Tracking not available for this booking status.'}, status=400)

        session, created = TrackingSession.objects.get_or_create(
            booking=booking,
            defaults={
                'provider': booking.provider.user if booking.provider else request.user,
                'is_active': True,
                'is_demo_mode': settings.DEMO_TRACKING,
                'started_at': timezone.now(),
                'customer_latitude': booking.latitude,
                'customer_longitude': booking.longitude,
            },
        )
        if not created:
            session.is_active = True
            session.started_at = timezone.now()
            session.save()
        if request.user.role in ('INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER'):
            booking.status = 'on_the_way'
            booking.save(update_fields=['status'])
        return Response(TrackingSessionSerializer(session).data)


class UpdateLocationView(APIView):
    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, pk=booking_id)
        if booking.provider and booking.provider.user != request.user and request.user.role != 'ADMIN':
            if not (booking.partner and booking.partner.user == request.user):
                return Response({'detail': 'Only assigned provider can update location.'}, status=403)
        session = get_object_or_404(TrackingSession, booking_id=booking_id, is_active=True)
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        LocationUpdate.objects.create(
            session=session, latitude=lat, longitude=lon,
            speed_kmh=request.data.get('speed'), heading=request.data.get('heading'),
        )
        session.last_latitude = lat
        session.last_longitude = lon
        session.last_update = timezone.now()
        session.save()
        channel_layer = get_channel_layer()
        if channel_layer:
            async_to_sync(channel_layer.group_send)(
                f'tracking_{booking_id}',
                {'type': 'location_update', 'latitude': str(lat), 'longitude': str(lon)},
            )
        return Response({'detail': 'Location updated.'})


class TrackingStatusView(APIView):
    def get(self, request, booking_id):
        booking = get_object_or_404(Booking, pk=booking_id)
        if not _can_track(request.user, booking):
            return Response({'detail': 'Not allowed.'}, status=403)
        try:
            session = TrackingSession.objects.get(booking_id=booking_id)
        except TrackingSession.DoesNotExist:
            return Response({'detail': 'No tracking session.', 'demo_mode_label': 'Demo Tracking Mode'}, status=404)
        data = TrackingSessionSerializer(session).data
        if session.is_demo_mode:
            data['demo_route'] = [{'lat': lat, 'lng': lon} for lat, lon in DEMO_ROUTE]
            data['demo_mode_label'] = 'Demo Tracking Mode'
        return Response(data)


class StopTrackingView(APIView):
    def post(self, request, booking_id):
        booking = get_object_or_404(Booking, pk=booking_id)
        if not _can_track(request.user, booking):
            return Response({'detail': 'Not allowed.'}, status=403)
        session = get_object_or_404(TrackingSession, booking_id=booking_id)
        session.is_active = False
        session.ended_at = timezone.now()
        session.save()
        return Response({'detail': 'Tracking stopped.'})
