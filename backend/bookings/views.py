import random
from datetime import datetime
from decimal import Decimal
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend

from core.permissions import IsAdmin
from .models import Booking, CustomerAvailability, Review, AppointmentSlot, BookingInvoice
from .serializers import (
    BookingSerializer, BookingCreateSerializer, CustomerAvailabilitySerializer,
    ReviewSerializer, BookingInvoiceSerializer,
)
from .scheduling import (
    find_available_slots, hold_slot, hold_technician_slot,
    is_technician_slot_available, release_expired_holds,
)

VALID_TRANSITIONS = {
    'requested': ['accepted', 'rejected', 'cancelled'],
    'accepted': ['preparing', 'cancelled'],
    'preparing': ['on_the_way', 'cancelled'],
    'on_the_way': ['arrived', 'cancelled'],
    'arrived': ['started', 'cancelled'],
    'started': ['completed', 'disputed'],
    'completed': [],
    'rejected': [],
    'cancelled': [],
    'disputed': ['completed', 'cancelled'],
}


def _can_access_booking(user, booking):
    if user.role == 'ADMIN':
        return True
    if user.role == 'CUSTOMER' and booking.customer == user:
        return True
    if user.role == 'INDIVIDUAL_PROVIDER' and booking.provider and booking.provider.user == user:
        return True
    if user.role == 'THIRD_PARTY_PARTNER' and booking.partner and booking.partner.user == user:
        return True
    return False


def _generate_invoice(booking):
    total = (
        Decimal(booking.visit_charge or 0)
        + Decimal(booking.labour_charge or 0)
        + Decimal(booking.material_charge or 0)
    )
    if not total:
        total = Decimal(booking.final_price or booking.estimated_price_max or 0)
    booking.final_price = total
    booking.save(update_fields=['final_price'])
    invoice, _ = BookingInvoice.objects.update_or_create(
        booking=booking,
        defaults={
            'visit_charge': booking.visit_charge or 0,
            'labour_charge': booking.labour_charge or 0,
            'material_charge': booking.material_charge or 0,
            'total_amount': total,
            'is_demo': booking.is_demo,
            'notes': 'Payment Demo — approximate demo invoice.',
        },
    )
    return invoice


class BookingListCreateView(generics.ListCreateAPIView):
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['status', 'category']

    def get_serializer_class(self):
        return BookingCreateSerializer if self.request.method == 'POST' else BookingSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Booking.objects.select_related('category', 'customer', 'provider', 'partner', 'technician')
        if user.role == 'CUSTOMER':
            return qs.filter(customer=user)
        if user.role == 'INDIVIDUAL_PROVIDER':
            return qs.filter(provider__user=user)
        if user.role == 'THIRD_PARTY_PARTNER':
            return qs.filter(partner__user=user)
        if user.role == 'ADMIN':
            return qs.all()
        return Booking.objects.none()

    def perform_create(self, serializer):
        release_expired_holds()
        booking = serializer.save(customer=self.request.user, status='requested')
        if booking.provider:
            booking.visit_charge = booking.provider.visit_charge
            booking.save(update_fields=['visit_charge'])
        booking.slot_status = 'awaiting_confirmation'
        booking.save(update_fields=['slot_status'])

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full_data = BookingSerializer(serializer.instance).data
        headers = self.get_success_headers(full_data)
        return Response(full_data, status=status.HTTP_201_CREATED, headers=headers)


class BookingDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Booking.objects.all()
        if user.role == 'CUSTOMER':
            return Booking.objects.filter(customer=user)
        if user.role == 'INDIVIDUAL_PROVIDER':
            return Booking.objects.filter(provider__user=user)
        if user.role == 'THIRD_PARTY_PARTNER':
            return Booking.objects.filter(partner__user=user)
        return Booking.objects.none()

    def patch(self, request, *args, **kwargs):
        booking = self.get_object()
        if 'before_photo' in request.FILES:
            booking.before_photo = request.FILES['before_photo']
        if 'after_photo' in request.FILES:
            booking.after_photo = request.FILES['after_photo']
        booking.save()
        return Response(BookingSerializer(booking).data)


class BookingStatusView(APIView):
    def post(self, request, pk, action=None):
        if action is None:
            action = request.path.rstrip('/').split('/')[-1]
        action_aliases = {'reject-slot': 'reject-slot', 'cancel': 'cancel'}
        action = action_aliases.get(action, action)

        booking = get_object_or_404(Booking, pk=pk)
        if not _can_access_booking(request.user, booking):
            return Response({'detail': 'Not allowed.'}, status=403)

        if action == 'reject-slot':
            AppointmentSlot.objects.filter(booking=booking, is_held=True).update(is_held=False)
            booking.slot_status = 'slot_requested'
            booking.status = 'rejected'
            booking.save()
            return Response(BookingSerializer(booking).data)

        action_map = {
            'accept': ('accepted', ['requested']),
            'reject': ('rejected', ['requested']),
            'prepare': ('preparing', ['accepted']),
            'start-travel': ('on_the_way', ['preparing', 'accepted']),
            'arrive': ('arrived', ['on_the_way']),
            'start-job': ('started', ['arrived']),
            'complete': ('completed', ['started']),
            'cancel': ('cancelled', None),
        }
        if action not in action_map:
            return Response({'detail': 'Invalid action.'}, status=400)

        new_status, allowed_from = action_map[action]
        if allowed_from and booking.status not in allowed_from and action != 'cancel':
            return Response({'detail': f'Cannot transition from {booking.status}.'}, status=400)

        if action == 'complete':
            otp = request.data.get('otp')
            if not booking.completion_otp:
                booking.completion_otp = str(random.randint(100000, 999999))
                booking.save(update_fields=['completion_otp'])
                return Response({
                    'detail': 'OTP generated. Provide OTP to complete.',
                    'demo_otp': booking.completion_otp,
                }, status=400)
            if not otp or otp != booking.completion_otp:
                return Response({'detail': 'Invalid OTP.'}, status=400)
            booking.otp_verified = True
            _generate_invoice(booking)
            from tracking.models import TrackingSession
            TrackingSession.objects.filter(booking=booking, is_active=True).update(
                is_active=False, ended_at=timezone.now()
            )

        if action == 'accept':
            booking.completion_otp = str(random.randint(100000, 999999))
            booking.slot_status = 'confirmed'
            technician_id = request.data.get('technician_id')
            if technician_id and booking.partner:
                from providers.models import PartnerTechnician
                tech = get_object_or_404(PartnerTechnician, pk=technician_id, partner=booking.partner)
                if booking.scheduled_start and booking.scheduled_end:
                    if not is_technician_slot_available(tech, booking.scheduled_start, booking.scheduled_end):
                        return Response({'detail': 'Technician not available at scheduled time.'}, status=409)
                booking.technician = tech

        booking.status = new_status
        if action == 'cancel':
            booking.cancellation_reason = request.data.get('reason', '')
            booking.slot_status = 'cancelled'
            AppointmentSlot.objects.filter(booking=booking).update(is_held=False)
        booking.save()
        return Response(BookingSerializer(booking).data)


class BookingAvailabilityView(APIView):
    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, customer=request.user)
        try:
            avail = booking.customer_availability
            return Response(CustomerAvailabilitySerializer(avail).data)
        except CustomerAvailability.DoesNotExist:
            return Response({})

    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, customer=request.user)
        serializer = CustomerAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        CustomerAvailability.objects.update_or_create(booking=booking, defaults=serializer.validated_data)
        return Response(serializer.data, status=201)

    def patch(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, customer=request.user)
        avail = get_object_or_404(CustomerAvailability, booking=booking)
        serializer = CustomerAvailabilitySerializer(avail, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class AvailableSlotsView(APIView):
    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if not _can_access_booking(request.user, booking):
            return Response({'detail': 'Not allowed.'}, status=403)
        release_expired_holds()
        preferred_date = booking.preferred_date or timezone.now().date()
        provider_id = request.query_params.get('provider_id')
        provider = booking.provider
        if not provider and provider_id:
            from providers.models import ServiceProvider
            provider = get_object_or_404(ServiceProvider, pk=provider_id)
        if not provider:
            return Response({'detail': 'No provider assigned.'}, status=400)
        slots = find_available_slots(
            provider, preferred_date,
            booking.preferred_time_start, booking.preferred_time_end,
            duration_minutes=60,
        )
        return Response({'slots': slots, 'demo_schedule_label': 'Demo Schedule'})


class HoldSlotView(APIView):
    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, customer=request.user)
        release_expired_holds()
        start = request.data.get('start_datetime')
        end = request.data.get('end_datetime')
        start_dt = datetime.fromisoformat(start.replace('Z', '+00:00'))
        end_dt = datetime.fromisoformat(end.replace('Z', '+00:00'))
        if timezone.is_naive(start_dt):
            start_dt = timezone.make_aware(start_dt)
            end_dt = timezone.make_aware(end_dt)

        provider_id = request.data.get('provider_id') or (booking.provider_id if booking.provider else None)
        technician_id = request.data.get('technician_id')

        if technician_id:
            from providers.models import PartnerTechnician
            tech = get_object_or_404(PartnerTechnician, pk=technician_id)
            slot = hold_technician_slot(tech, start_dt, end_dt)
            if not slot:
                return Response({'detail': 'Technician slot not available.'}, status=409)
            booking.partner = tech.partner
            booking.technician = tech
        else:
            from providers.models import ServiceProvider
            provider = booking.provider or get_object_or_404(ServiceProvider, pk=provider_id)
            slot = hold_slot(provider, start_dt, end_dt)
            if not slot:
                return Response({'detail': 'Slot not available.'}, status=409)
            booking.provider = provider
            booking.visit_charge = provider.visit_charge

        slot.booking = booking
        slot.save()
        booking.slot_status = 'slot_held'
        booking.scheduled_start = start_dt
        booking.scheduled_end = end_dt
        booking.save()
        return Response({
            'slot_id': slot.id,
            'hold_expires_at': slot.hold_expires_at,
            'hold_minutes': 15,
        })


class ConfirmSlotView(APIView):
    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if request.user.role not in ('INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER', 'ADMIN'):
            if booking.customer != request.user:
                return Response({'detail': 'Not allowed.'}, status=403)
        slot_id = request.data.get('slot_id')
        slot = get_object_or_404(AppointmentSlot, pk=slot_id, booking=booking)
        slot.is_confirmed = True
        slot.is_held = False
        slot.save()
        booking.slot_status = 'confirmed'
        booking.status = 'accepted'
        booking.save()
        return Response(BookingSerializer(booking).data)


class ReleaseSlotView(APIView):
    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk, customer=request.user)
        AppointmentSlot.objects.filter(booking=booking, is_held=True).update(is_held=False)
        booking.slot_status = 'slot_requested'
        booking.save()
        return Response({'detail': 'Slot released.'})


class RescheduleView(APIView):
    def post(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if booking.customer != request.user and request.user.role not in ('ADMIN', 'INDIVIDUAL_PROVIDER', 'THIRD_PARTY_PARTNER'):
            return Response({'detail': 'Not allowed.'}, status=403)
        new_start = request.data.get('start_datetime')
        new_end = request.data.get('end_datetime')
        if new_start and new_end:
            start_dt = datetime.fromisoformat(new_start.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(new_end.replace('Z', '+00:00'))
            if timezone.is_naive(start_dt):
                start_dt = timezone.make_aware(start_dt)
                end_dt = timezone.make_aware(end_dt)
            booking.scheduled_start = start_dt
            booking.scheduled_end = end_dt
            booking.slot_status = 'rescheduled'
        else:
            booking.slot_status = 'reschedule_requested'
        booking.save()
        return Response(BookingSerializer(booking).data)


class BookingInvoiceView(APIView):
    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)
        if not _can_access_booking(request.user, booking):
            return Response({'detail': 'Not allowed.'}, status=403)
        if booking.status != 'completed':
            return Response({'detail': 'Invoice available after completion.'}, status=400)
        invoice = getattr(booking, 'invoice', None)
        if not invoice:
            invoice = _generate_invoice(booking)
        data = BookingInvoiceSerializer(invoice).data
        data['demo_price_label'] = 'Approximate Demo Price'
        return Response(data)


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        booking = get_object_or_404(
            Booking, pk=self.kwargs['pk'], customer=self.request.user, status='completed'
        )
        if hasattr(booking, 'review'):
            from rest_framework.exceptions import ValidationError
            raise ValidationError('Review already submitted.')
        serializer.save(
            customer=self.request.user,
            booking=booking,
            provider=booking.provider,
            partner=booking.partner,
        )
