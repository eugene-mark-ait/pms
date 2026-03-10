from rest_framework import serializers
from .models import VacateNotice, VacancyListing, TenantVacancyPreference
from properties.serializers import UnitSerializer, PropertyListSerializer


class VacateNoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacateNotice
        fields = ["id", "lease", "move_out_date", "reason", "notice_message", "created_at"]


class VacancyListingSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)

    class Meta:
        model = VacancyListing
        fields = ["id", "property", "unit", "available_from", "is_filled", "created_at"]


class VacancySearchSerializer(serializers.ModelSerializer):
    """For public/tenant search: vacancy with property summary and unit details."""
    unit = UnitSerializer(read_only=True)
    property = PropertyListSerializer(read_only=True)

    class Meta:
        model = VacancyListing
        fields = ["id", "property", "unit", "available_from", "is_filled", "created_at"]


class TenantVacancyPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TenantVacancyPreference
        fields = ["id", "is_looking", "preferred_unit_type", "preferred_location", "created_at", "updated_at"]
