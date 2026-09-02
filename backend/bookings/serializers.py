from rest_framework import serializers
from .models import (
    Booking, AppointmentSlot, CustomerAvailability, Review,
    ScheduleChange, ProviderRecommendation, BookingInvoice,
)
from providers.serializers import ServiceProviderSerializer, ThirdPartyPartnerSerializer
from services.serializers import ServiceCategorySerializer


class BookingSerializer(serializers.ModelSerializer):
    category_detail = ServiceCategorySerializer(source='category', read_only=True)
    provider_detail = ServiceProviderSerializer(source='provider', read_only=True)
    partner_detail = ThirdPartyPartnerSerializer(source='partner', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)

    class Meta:
        model = Booking
        fields = '__all__'
        read_only_fields = [
            'customer', 'completion_otp', 'otp_verified', 'status',
            'slot_status', 'created_at', 'updated_at',
        ]


class BookingCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Booking
        fields = [
            'category', 'diagnosis', 'provider', 'partner', 'issue_description',
            'address', 'latitude', 'longitude', 'preferred_date',
            'preferred_time_start', 'preferred_time_end', 'flexible_timing',
            'access_instructions', 'contact_person', 'preferred_language',
            'allow_contact', 'estimated_price_min', 'estimated_price_max',
            'issue_photo', 'notes',
        ]


class CustomerAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerAvailability
        fields = '__all__'


class AppointmentSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = AppointmentSlot
        fields = '__all__'


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['customer', 'booking', 'created_at']


class BookingInvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookingInvoice
        fields = '__all__'
