from rest_framework import serializers
from .models import HouseholdAsset, MaintenanceRecord


class MaintenanceRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MaintenanceRecord
        fields = '__all__'
        read_only_fields = ['created_at']


class HouseholdAssetSerializer(serializers.ModelSerializer):
    maintenance_records = MaintenanceRecordSerializer(many=True, read_only=True)

    class Meta:
        model = HouseholdAsset
        fields = '__all__'
        read_only_fields = ['owner', 'created_at', 'updated_at']
