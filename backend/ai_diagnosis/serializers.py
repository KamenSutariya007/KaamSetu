from rest_framework import serializers
from .models import AIDiagnosis


class AIDiagnosisSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIDiagnosis
        fields = '__all__'
        read_only_fields = ['user', 'created_at']
