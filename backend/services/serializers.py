from rest_framework import serializers
from .models import ServiceCategory, RepairGuide, PriceRange


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = '__all__'


class RepairGuideSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = RepairGuide
        fields = '__all__'


class RepairGuideListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = RepairGuide
        fields = [
            'id', 'title', 'title_gu', 'slug', 'category', 'category_name',
            'difficulty', 'estimated_time', 'estimated_cost_min', 'estimated_cost_max',
            'is_demo', 'is_active',
        ]


class PriceRangeSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = PriceRange
        fields = '__all__'
