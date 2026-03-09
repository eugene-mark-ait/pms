from rest_framework import serializers
from .models import Property, Unit, PropertyRule, ManagerAssignment, CaretakerAssignment
from accounts.serializers import UserSerializer


class UnitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Unit
        fields = ["id", "property", "unit_number", "created_at"]


class PropertyRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PropertyRule
        fields = ["id", "property", "title", "description", "created_at"]


class ManagerAssignmentSerializer(serializers.ModelSerializer):
    manager = UserSerializer(read_only=True)

    class Meta:
        model = ManagerAssignment
        fields = ["id", "property", "manager", "assigned_at"]


class CaretakerAssignmentSerializer(serializers.ModelSerializer):
    caretaker = UserSerializer(read_only=True)

    class Meta:
        model = CaretakerAssignment
        fields = ["id", "property", "caretaker", "assigned_at"]


class AssignManagerSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class AssignCaretakerSerializer(serializers.Serializer):
    user_id = serializers.UUIDField()


class PropertyListSerializer(serializers.ModelSerializer):
    unit_count = serializers.SerializerMethodField()

    class Meta:
        model = Property
        fields = ["id", "name", "address", "landlord", "unit_count", "created_at"]
        read_only_fields = ["id", "landlord", "unit_count", "created_at"]

    def get_unit_count(self, obj):
        return obj.units.count()


class PropertyCreateUpdateSerializer(serializers.ModelSerializer):
    """Create/update: name and address only (landlord set in view)."""
    class Meta:
        model = Property
        fields = ["name", "address"]


class PropertyDetailSerializer(serializers.ModelSerializer):
    units = UnitSerializer(many=True, read_only=True)
    rules = PropertyRuleSerializer(many=True, read_only=True)
    manager_assignments = ManagerAssignmentSerializer(many=True, read_only=True)
    caretaker_assignments = CaretakerAssignmentSerializer(many=True, read_only=True)
    landlord = UserSerializer(read_only=True)

    class Meta:
        model = Property
        fields = [
            "id",
            "name",
            "address",
            "landlord",
            "units",
            "rules",
            "manager_assignments",
            "caretaker_assignments",
            "created_at",
            "updated_at",
        ]
