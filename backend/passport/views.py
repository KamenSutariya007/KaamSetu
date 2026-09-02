from rest_framework import generics
from .models import HouseholdAsset, MaintenanceRecord
from .serializers import HouseholdAssetSerializer, MaintenanceRecordSerializer


class HouseholdAssetListCreateView(generics.ListCreateAPIView):
    serializer_class = HouseholdAssetSerializer

    def get_queryset(self):
        return HouseholdAsset.objects.filter(owner=self.request.user).prefetch_related('maintenance_records')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)


class HouseholdAssetDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HouseholdAssetSerializer

    def get_queryset(self):
        return HouseholdAsset.objects.filter(owner=self.request.user)


class MaintenanceRecordCreateView(generics.CreateAPIView):
    serializer_class = MaintenanceRecordSerializer

    def perform_create(self, serializer):
        asset = HouseholdAsset.objects.get(pk=self.kwargs['asset_id'], owner=self.request.user)
        serializer.save(asset=asset)
