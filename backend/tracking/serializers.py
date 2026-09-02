from rest_framework import serializers
from .models import TrackingSession, LocationUpdate


class LocationUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationUpdate
        fields = '__all__'


class TrackingSessionSerializer(serializers.ModelSerializer):
    location_updates = LocationUpdateSerializer(many=True, read_only=True)

    class Meta:
        model = TrackingSession
        fields = '__all__'
