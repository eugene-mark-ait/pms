from datetime import date as date_type

from rest_framework import serializers
from .models import VacateNotice, VacancyListing, TenantVacancyPreference, UnitVacancyInfo, UnitNotificationSubscription
from properties.serializers import UnitSerializer, PropertyListSerializer
from properties.models import Unit


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


class VacancyNotifySubscribeSerializer(serializers.ModelSerializer):
    """Subscribe to vacancy notifications with email, optional phone, and saved search filters."""
    class Meta:
        model = UnitNotificationSubscription
        fields = ["id", "email", "phone", "search_filters", "created_at"]
        read_only_fields = ["id", "created_at"]

    def validate_search_filters(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("search_filters must be a JSON object.")
        allowed = {"unit_type", "location", "min_rent", "max_rent"}
        if any(k not in allowed for k in value):
            pass  # allow extra keys for future use; only use allowed in matching
        return value


def _get_available_from(unit):
    """Available date: from UnitVacancyInfo, or VacancyListing, or today."""
    try:
        info = unit.vacancy_info
        return info.available_from
    except UnitVacancyInfo.DoesNotExist:
        pass
    listing = VacancyListing.objects.filter(unit=unit, is_filled=False).order_by("available_from").first()
    if listing:
        return listing.available_from
    return date_type.today()


def _get_contact_visibility(unit):
    """Return (show_landlord, show_manager, show_caretaker) from UnitVacancyInfo or (False, False, False)."""
    try:
        info = unit.vacancy_info
        return (info.show_landlord_phone, info.show_manager_phone, info.show_caretaker_phone)
    except UnitVacancyInfo.DoesNotExist:
        return (False, False, False)


def _build_contact(unit, show_landlord, show_manager, show_caretaker):
    """Build contact dict with only visible phones."""
    prop = unit.property
    out = {}
    if show_landlord and prop.landlord_id:
        out["landlord_phone"] = (getattr(prop.landlord, "phone", None) or "").strip() or None
    if show_manager:
        ma = prop.manager_assignments.order_by("assigned_at").first()
        out["manager_phone"] = (ma.contact_phone if ma else "").strip() or None
    if show_caretaker:
        ca = prop.caretaker_assignments.order_by("assigned_at").first()
        out["caretaker_phone"] = (ca.contact_phone if ca else "").strip() or None
    return out


class VacancyDiscoverySerializer(serializers.Serializer):
    """One discoverable vacancy for tenant search/detail. Contact fields only if landlord allowed. Includes property public listing info."""
    id = serializers.SerializerMethodField()
    unit_id = serializers.SerializerMethodField()
    unit_number = serializers.SerializerMethodField()
    unit_type = serializers.SerializerMethodField()
    monthly_rent = serializers.SerializerMethodField()
    available_from = serializers.SerializerMethodField()
    property_id = serializers.SerializerMethodField()
    property_name = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    public_description = serializers.SerializerMethodField()
    amenities = serializers.SerializerMethodField()
    parking_info = serializers.SerializerMethodField()
    nearby_landmarks = serializers.SerializerMethodField()
    house_rules = serializers.SerializerMethodField()
    contact_preference = serializers.SerializerMethodField()
    contact = serializers.SerializerMethodField()
    first_image = serializers.SerializerMethodField()

    def get_id(self, obj):
        return str(obj.id)

    def get_unit_id(self, obj):
        return str(obj.id)

    def get_unit_number(self, obj):
        return obj.unit_number

    def get_unit_type(self, obj):
        return obj.get_unit_type_display() if obj.unit_type else obj.unit_type

    def get_monthly_rent(self, obj):
        return str(obj.monthly_rent)

    def get_available_from(self, obj):
        return _get_available_from(obj).isoformat()

    def get_property_id(self, obj):
        return str(obj.property_id)

    def get_property_name(self, obj):
        return obj.property.name if obj.property_id else None

    def get_address(self, obj):
        return obj.property.address if obj.property_id else ""

    def get_location(self, obj):
        return (obj.property.location or "") if obj.property_id else ""

    def get_public_description(self, obj):
        return (obj.property.public_description or "") if obj.property_id else ""

    def get_amenities(self, obj):
        return (obj.property.amenities or "") if obj.property_id else ""

    def get_parking_info(self, obj):
        return (obj.property.parking_info or "") if obj.property_id else ""

    def get_nearby_landmarks(self, obj):
        return (obj.property.nearby_landmarks or "") if obj.property_id else ""

    def get_house_rules(self, obj):
        return (obj.property.house_rules or "") if obj.property_id else ""

    def get_contact_preference(self, obj):
        return (obj.property.contact_preference or "") if obj.property_id else ""

    def get_contact(self, obj):
        show_landlord, show_manager, show_caretaker = _get_contact_visibility(obj)
        return _build_contact(obj, show_landlord, show_manager, show_caretaker)

    def get_first_image(self, obj):
        img = obj.images.order_by("sort_order", "created_at").first()
        if img and img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        prop_img = obj.property.images.order_by("sort_order", "created_at").first() if obj.property_id else None
        if prop_img and prop_img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(prop_img.image.url)
            return prop_img.image.url
        return None
