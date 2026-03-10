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

    class Meta:
        model = Unit
        fields = [
            "id", "property", "unit_number", "unit_type", "monthly_rent",
            "is_vacant", "images", "created_at", "updated_at",
        ]


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
    """Create/update: name, address, location (landlord set in view)."""
    class Meta:
        model = Property
        fields = ["name", "address", "location"]


class PropertyDetailSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True)
    rules = PropertyRuleSerializer(many=True, read_only=True)
    images = PropertyImageSerializer(many=True, read_only=True)
    manager_assignments = ManagerAssignmentSerializer(many=True, read_only=True)
    caretaker_assignments = CaretakerAssignmentSerializer(many=True, read_only=True)
    landlord = UserSerializer(read_only=True)

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
            "rules",
            "manager_assignments",
            "caretaker_assignments",
            "created_at",
            "updated_at",
        ]
