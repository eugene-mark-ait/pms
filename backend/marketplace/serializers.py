from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "id",
            "provider",
            "title",
            "category",
            "description",
            "price_range",
            "service_area",
            "availability",
            "contact_info",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "provider", "created_at", "updated_at"]


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "title",
            "category",
            "description",
            "price_range",
            "service_area",
            "availability",
            "contact_info",
        ]

    def validate_title(self, value):
        if not (value and value.strip()):
            raise serializers.ValidationError("Service title is required.")
        return value.strip()

    def validate_description(self, value):
        if not (value and value.strip()):
            raise serializers.ValidationError("Description is required.")
        return value.strip()

    def validate_service_area(self, value):
        if not (value and value.strip()):
            raise serializers.ValidationError("Service area / location is required.")
        return value.strip()
