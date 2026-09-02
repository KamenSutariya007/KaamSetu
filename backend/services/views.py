from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import ServiceCategory, RepairGuide, PriceRange
from .serializers import (
    ServiceCategorySerializer, RepairGuideSerializer,
    RepairGuideListSerializer, PriceRangeSerializer,
)


class ServiceCategoryListView(generics.ListAPIView):
    queryset = ServiceCategory.objects.filter(is_active=True)
    serializer_class = ServiceCategorySerializer
    permission_classes = [permissions.AllowAny]


class RepairGuideListView(generics.ListAPIView):
    queryset = RepairGuide.objects.filter(is_active=True)
    serializer_class = RepairGuideListSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'difficulty']


class RepairGuideDetailView(generics.RetrieveAPIView):
    queryset = RepairGuide.objects.filter(is_active=True)
    serializer_class = RepairGuideSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'


class PriceRangeListView(generics.ListAPIView):
    queryset = PriceRange.objects.all()
    serializer_class = PriceRangeSerializer
    permission_classes = [permissions.AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'city']


class FairPriceCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        quoted = float(request.data.get('quoted_price', 0))
        category_id = request.data.get('category_id')
        city = request.data.get('city', 'Ahmedabad')
        qs = PriceRange.objects.filter(city=city)
        if category_id:
            qs = qs.filter(category_id=category_id)
        pr = qs.first()
        if not pr:
            return Response({'detail': 'No price range found for this category.'}, status=404)
        typical_min = float(pr.visit_charge_min + pr.labour_min + pr.material_min)
        typical_max = float(pr.visit_charge_max + pr.labour_max + pr.material_max)
        suggestion = 'Ask for a material cost breakup.'
        if quoted > typical_max * 1.2:
            suggestion = 'Quoted price is above typical range. Ask for itemized breakup.'
        return Response({
            'quoted_price': quoted,
            'typical_range_min': typical_min,
            'typical_range_max': typical_max,
            'visit_charge': {'min': float(pr.visit_charge_min), 'max': float(pr.visit_charge_max)},
            'labour': {'min': float(pr.labour_min), 'max': float(pr.labour_max)},
            'material': {'min': float(pr.material_min), 'max': float(pr.material_max)},
            'suggestion': suggestion,
            'transparency_warning': 'Always request written estimate before work begins.',
            'demo_price_label': 'Approximate Demo Price',
            'is_demo': pr.is_demo,
        })
