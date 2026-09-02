from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404

from core.permissions import IsProvider, IsPartner
from .models import (
    ServiceProvider, ProviderDocument, ProviderAvailability, ProviderBlockedSlot,
    ThirdPartyPartner, PartnerTechnician, TechnicianAvailability,
    PartnerWarrantyClaim, PartnerQuotation, PartnerSparePart,
)
from .serializers import (
    ServiceProviderSerializer, ProviderDocumentSerializer,
    ProviderAvailabilitySerializer, ProviderBlockedSlotSerializer,
    ThirdPartyPartnerSerializer, PartnerTechnicianSerializer,
    PartnerWarrantyClaimSerializer, PartnerQuotationSerializer, PartnerSparePartSerializer,
)
from .recommendations import get_recommendations


class ProviderListView(generics.ListAPIView):
    queryset = ServiceProvider.objects.filter(is_active=True).select_related('user').prefetch_related('categories')
    serializer_class = ServiceProviderSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['verification_status', 'emergency_available']


class ProviderDetailView(generics.RetrieveAPIView):
    queryset = ServiceProvider.objects.filter(is_active=True)
    serializer_class = ServiceProviderSerializer
    permission_classes = [permissions.AllowAny]


class PartnerListView(generics.ListAPIView):
    queryset = ThirdPartyPartner.objects.filter(is_active=True).select_related('user').prefetch_related('categories')
    serializer_class = ThirdPartyPartnerSerializer
    permission_classes = [permissions.AllowAny]


class PartnerDetailView(generics.RetrieveAPIView):
    queryset = ThirdPartyPartner.objects.filter(is_active=True)
    serializer_class = ThirdPartyPartnerSerializer
    permission_classes = [permissions.AllowAny]


class ProviderProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ServiceProviderSerializer
    permission_classes = [IsProvider]

    def get_object(self):
        return get_object_or_404(ServiceProvider, user=self.request.user)


class PartnerProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = ThirdPartyPartnerSerializer
    permission_classes = [IsPartner]

    def get_object(self):
        return get_object_or_404(ThirdPartyPartner, user=self.request.user)


class ProviderDocumentView(generics.ListCreateAPIView):
    serializer_class = ProviderDocumentSerializer
    permission_classes = [IsProvider]

    def get_queryset(self):
        return ProviderDocument.objects.filter(provider__user=self.request.user)

    def perform_create(self, serializer):
        provider = get_object_or_404(ServiceProvider, user=self.request.user)
        serializer.save(provider=provider)


class ProviderAvailabilityView(APIView):
    permission_classes = [IsProvider]

    def get(self, request, pk):
        provider = get_object_or_404(ServiceProvider, pk=pk)
        if provider.user != request.user and request.user.role != 'ADMIN':
            return Response({'detail': 'Not allowed.'}, status=403)
        slots = ProviderAvailability.objects.filter(provider=provider)
        return Response(ProviderAvailabilitySerializer(slots, many=True).data)

    def post(self, request, pk):
        provider = get_object_or_404(ServiceProvider, user=request.user, pk=pk)
        serializer = ProviderAvailabilitySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(provider=provider)
        return Response(serializer.data, status=201)

    def patch(self, request, pk):
        provider = get_object_or_404(ServiceProvider, user=request.user, pk=pk)
        slot_id = request.data.get('id')
        slot = get_object_or_404(ProviderAvailability, pk=slot_id, provider=provider)
        serializer = ProviderAvailabilitySerializer(slot, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ProviderBlockSlotView(APIView):
    permission_classes = [IsProvider]

    def post(self, request, pk):
        provider = get_object_or_404(ServiceProvider, user=request.user, pk=pk)
        serializer = ProviderBlockedSlotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(provider=provider)
        return Response(serializer.data, status=201)

    def delete(self, request, pk, slot_id):
        provider = get_object_or_404(ServiceProvider, user=request.user, pk=pk)
        slot = get_object_or_404(ProviderBlockedSlot, pk=slot_id, provider=provider)
        slot.delete()
        return Response(status=204)


class RecommendationsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category = request.query_params.get('category', 'plumbing')
        lat = request.query_params.get('lat')
        lon = request.query_params.get('lon')
        results = get_recommendations(
            category,
            float(lat) if lat else None,
            float(lon) if lon else None,
        )
        serialized = {'sections': {}}
        for section, items in results.get('sections', {}).items():
            serialized['sections'][section] = []
            for item in items:
                if item['type'] == 'provider':
                    data = ServiceProviderSerializer(item['data']).data
                else:
                    data = ThirdPartyPartnerSerializer(item['data']).data
                data['recommendation_score'] = item['score']
                data['distance_km'] = item.get('distance_km')
                data['eta_minutes'] = item.get('eta_minutes')
                data['entity_type'] = item['type']
                serialized['sections'][section].append(data)
        return Response(serialized)


class PartnerTechnicianListCreateView(generics.ListCreateAPIView):
    serializer_class = PartnerTechnicianSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        partner = get_object_or_404(ThirdPartyPartner, user=self.request.user)
        return PartnerTechnician.objects.filter(partner=partner).prefetch_related('categories')

    def perform_create(self, serializer):
        partner = get_object_or_404(ThirdPartyPartner, user=self.request.user)
        serializer.save(partner=partner)


class PartnerTechnicianDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PartnerTechnicianSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        return PartnerTechnician.objects.filter(partner__user=self.request.user)


class PartnerDashboardStatsView(APIView):
    permission_classes = [IsPartner]

    def get(self, request):
        partner = get_object_or_404(ThirdPartyPartner, user=request.user)
        from bookings.models import Booking
        bookings = Booking.objects.filter(partner=partner)
        return Response({
            'organization': ThirdPartyPartnerSerializer(partner).data,
            'incoming_requests': bookings.filter(status='requested').count(),
            'active_jobs': bookings.filter(status__in=['accepted', 'preparing', 'on_the_way', 'arrived', 'started']).count(),
            'completed_jobs': bookings.filter(status='completed').count(),
            'technicians': partner.technicians.filter(is_active=True).count(),
            'warranty_claims': partner.warranty_claims.exclude(status='closed').count(),
            'quotations': partner.quotations.filter(status='sent').count(),
            'spare_parts': partner.spare_parts.filter(in_stock=True).count(),
            'total_revenue': float(partner.total_revenue),
            'average_rating': float(partner.average_rating),
            'demo_data_label': 'Demo Data' if partner.is_demo else None,
        })


class PartnerWarrantyClaimView(generics.ListCreateAPIView):
    serializer_class = PartnerWarrantyClaimSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        return PartnerWarrantyClaim.objects.filter(partner__user=self.request.user)

    def perform_create(self, serializer):
        partner = get_object_or_404(ThirdPartyPartner, user=self.request.user)
        serializer.save(partner=partner)


class PartnerQuotationView(generics.ListCreateAPIView):
    serializer_class = PartnerQuotationSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        return PartnerQuotation.objects.filter(partner__user=self.request.user)

    def perform_create(self, serializer):
        partner = get_object_or_404(ThirdPartyPartner, user=self.request.user)
        serializer.save(partner=partner)


class PartnerSparePartView(generics.ListCreateAPIView):
    serializer_class = PartnerSparePartSerializer
    permission_classes = [IsPartner]

    def get_queryset(self):
        return PartnerSparePart.objects.filter(partner__user=self.request.user)

    def perform_create(self, serializer):
        partner = get_object_or_404(ThirdPartyPartner, user=self.request.user)
        serializer.save(partner=partner, is_demo=partner.is_demo)
