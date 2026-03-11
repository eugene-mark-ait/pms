from rest_framework import serializers
from .models import (
    Property,
    PropertyImage,
    Unit,
    UnitImage,
    PropertyRule,
    ManagerAssignment,
    CaretakerAssignment,
)
from accounts.serializers import UserSerializer


class PropertyImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyImage
        fields = ["id", "image", "caption", "sort_order"]


class UnitImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitImage
        fields = ["id", "image", "caption", "sort_order"]


class UnitSerializer(serializers.ModelSerializer):
    images = UnitImageSerializer(many=True, read_only=True)
    current_tenant_name = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = [
            "id", "property", "unit_number", "unit_type", "monthly_rent",
            "security_deposit", "service_charge", "extra_costs", "payment_frequency",
            "is_vacant", "current_tenant_name", "images", "created_at", "updated_at",
        ]

    def get_current_tenant_name(self, obj):
        if obj.is_vacant:
            return None
        active = obj.leases.filter(is_active=True).select_related("tenant").first()
        if not active or not active.tenant:
            return None
        t = active.tenant
        name = f"{t.first_name or ''} {t.last_name or ''}".strip()
        return name or t.email


class PropertyRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyRule
        fields = ["id", "property", "title", "description", "created_at"]


class ManagerAssignmentSerializer(serializers.ModelSerializer):
    manager = UserSerializer(read_only=True)

    class Meta:
        model = ManagerAssignment
        fields = ["id", "property", "manager", "contact_phone", "assigned_at"]


class CaretakerAssignmentSerializer(serializers.ModelSerializer):
    caretaker = UserSerializer(read_only=True)

    class Meta:
        model = CaretakerAssignment
        fields = ["id", "property", "caretaker", "contact_phone", "assigned_at"]


class AssignManagerSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class AssignCaretakerSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class PropertyListSerializer(serializers.ModelSerializer):
    unit_count = serializers.SerializerMethodField()
    first_image = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = ["id", "name", "address", "location", "landlord", "unit_count", "first_image", "created_at"]
        read_only_fields = ["id", "landlord", "unit_count", "created_at"]

    def get_unit_count(self, obj):
        return obj.units.count()

    def get_first_image(self, obj):
        img = obj.images.order_by("sort_order", "created_at").first()
        if img and img.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(img.image.url)
            return img.image.url
        return None


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/update: name, address, location (landlord set in view). Returns id on create."""
    class Meta:
        model = Property
        fields = ["id", "name", "address", "location"]
        read_only_fields = ["id"]


class PropertyDetailSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True)
    rules = PropertyRuleSerializer(many=True, read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    manager_assignments = ManagerAssignmentSerializer(many=True, read_only=True)
    caretaker_assignments = CaretakerAssignmentSerializer(many=True, read_only=True)
    landlord = UserSerializer(read_only=True)
    unit_count = serializers.SerializerMethodField()
    occupied_count = serializers.SerializerMethodField()
    vacant_count = serializers.SerializerMethodField()
    total_rent_potential = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = [
            "id",
            "name",
            "address",
            "location",
            "landlord",
            "images",
            "units",
            "unit_count",
            "occupied_count",
            "vacant_count",
            "total_rent_potential",
            "rules",
            "manager_assignments",
            "caretaker_assignments",
            "created_at",
            "updated_at",
        ]

    def get_unit_count(self, obj):
        return obj.units.count()

    def get_occupied_count(self, obj):
        return obj.units.filter(is_vacant=False).count()

    def get_vacant_count(self, obj):
        return obj.units.filter(is_vacant=True).count()

    def get_total_rent_potential(self, obj):
        from django.db.models import Sum
        total = obj.units.aggregate(s=Sum("monthly_rent"))["s"]
        return total if total is not None else 0
