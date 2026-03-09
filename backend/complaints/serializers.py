from rest_framework import serializers
from .models import Complaint


class ComplaintSerializer(serializers.ModelSerializer):
    class Meta:
        model = Complaint
        fields = [
            "id",
            "property",
            "unit",
            "tenant",
            "title",
            "description",
            "status",
            "created_at",
            "updated_at",
            "resolved_at",
        ]
        read_only_fields = ["id", "tenant", "created_at"]
