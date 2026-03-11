from rest_framework import serializers
from .models import VacateNotice, VacancyListing, TenantVacancyPreference
from properties.serializers import UnitSerializer, PropertyListSerializer


class VacateNoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacateNotice
        fields = ["id", "lease", "move_out_date", "reason", "notice_message", "created_at"]


class VacancyListingSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)
    tenant_name = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()
    unit_number = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()
    property_id = serializers.SerializerMethodField()
    notice_due_date = serializers.SerializerMethodField()

    class Meta:
        model = VacancyListing
        fields = [
            "id", "property", "property_id", "property_name",
            "unit", "unit_id", "unit_number",
            "tenant_name", "notice_due_date",
            "available_from", "is_filled", "created_at",
        ]

    def get_tenant_name(self, obj):
        if not obj.vacate_notice or not obj.vacate_notice.lease_id:
            return None
        tenant = obj.vacate_notice.lease.tenant
        name = f"{tenant.first_name or ''} {tenant.last_name or ''}".strip()
        return name or tenant.email

    def get_property_name(self, obj):
        return obj.property.name if obj.property_id else None

    def get_property_id(self, obj):
        return str(obj.property_id) if obj.property_id else None

    def get_unit_number(self, obj):
        return obj.unit.unit_number if obj.unit_id else None

    def get_unit_id(self, obj):
        return str(obj.unit_id) if obj.unit_id else None

    def get_notice_due_date(self, obj):
        return obj.available_from


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
