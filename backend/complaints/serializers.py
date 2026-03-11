from rest_framework import serializers
from .models import Complaint
from accounts.serializers import UserSerializer


class ComplaintSerializer(serializers.ModelSerializer):
    tenant = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)

    class Meta:
        model = Complaint
        fields = [
            "id",
            "property",
            "unit",
            "tenant",
            "lease",
            "assigned_to",
            "title",
            "description",
            "status",
            "priority",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        read_only_fields = ["id", "tenant", "created_at"]


class ComplaintCreateSerializer(serializers.ModelSerializer):
    """Create: tenant sets assigned_to and optionally lease (caretaker/manager/landlord for this property)."""
    class Meta:
        model = Complaint
        fields = [
            "property",
            "unit",
            "lease",
            "assigned_to",
            "title",
            "description",
            "priority",
        ]

    def validate(self, attrs):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        prop = attrs.get("property")
        assigned_to = attrs.get("assigned_to")
        if not assigned_to:
            raise serializers.ValidationError({"assigned_to": "You must choose who this complaint goes to (caretaker, manager, or landlord)."})
        if prop and assigned_to:
            is_landlord = prop.landlord_id == assigned_to.id
            is_manager = prop.manager_assignments.filter(manager=assigned_to).exists()
            is_caretaker = prop.caretaker_assignments.filter(caretaker=assigned_to).exists()
            if not (is_landlord or is_manager or is_caretaker):
                raise serializers.ValidationError({"assigned_to": "Chosen user must be the landlord, a manager, or a caretaker of this property."})
        return attrs
