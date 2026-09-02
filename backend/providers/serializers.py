from rest_framework import serializers
from accounts.serializers import UserSerializer
from .models import (
    ServiceProvider, ProviderDocument, ProviderAvailability,
    ProviderBlockedSlot, ThirdPartyPartner, PartnerTechnician,
    PartnerWarrantyClaim, PartnerQuotation, PartnerSparePart,
)


class ServiceProviderSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    categories = serializers.SerializerMethodField()

    class Meta:
        model = ServiceProvider
        fields = [
            'id', 'user', 'bio', 'experience_years', 'visit_charge',
            'service_radius_km', 'base_latitude', 'base_longitude',
            'categories', 'verification_status', 'average_rating',
            'total_reviews', 'completed_jobs', 'on_time_rate', 'response_rate',
            'trust_score', 'total_earnings', 'emergency_available',
            'is_active', 'is_demo',
        ]

    def get_categories(self, obj):
        return [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in obj.categories.all()]


class ProviderDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderDocument
        fields = '__all__'
        read_only_fields = ['provider', 'verified', 'uploaded_at']


class ProviderAvailabilitySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderAvailability
        fields = '__all__'
        read_only_fields = ['provider']


class ProviderBlockedSlotSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProviderBlockedSlot
        fields = '__all__'
        read_only_fields = ['provider', 'created_at']


class ThirdPartyPartnerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    categories = serializers.SerializerMethodField()

    class Meta:
        model = ThirdPartyPartner
        fields = [
            'id', 'user', 'organization_name', 'partner_type', 'description',
            'authorized_brands', 'categories', 'address', 'latitude', 'longitude',
            'service_radius_km', 'verification_status', 'badges',
            'average_rating', 'total_reviews', 'completed_jobs',
            'response_time_hours', 'trust_score', 'total_revenue',
            'emergency_available', 'warranty_support', 'spare_parts_available',
            'is_active', 'is_demo',
        ]

    def get_categories(self, obj):
        return [{'id': c.id, 'name': c.name, 'slug': c.slug} for c in obj.categories.all()]


class PartnerTechnicianSerializer(serializers.ModelSerializer):
    categories = serializers.SerializerMethodField()

    class Meta:
        model = PartnerTechnician
        fields = '__all__'
        read_only_fields = ['partner']

    def get_categories(self, obj):
        return [{'id': c.id, 'name': c.name} for c in obj.categories.all()]


class PartnerWarrantyClaimSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerWarrantyClaim
        fields = '__all__'
        read_only_fields = ['partner', 'created_at']


class PartnerQuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerQuotation
        fields = '__all__'
        read_only_fields = ['partner', 'created_at']


class PartnerSparePartSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartnerSparePart
        fields = '__all__'
        read_only_fields = ['partner']
