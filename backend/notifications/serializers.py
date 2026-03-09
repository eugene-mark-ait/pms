from rest_framework import serializers
from .models import Notification


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ["id", "notification_type", "title", "body", "read_at", "created_at"]


class NotificationMarkReadSerializer(serializers.Serializer):
    read = serializers.BooleanField(default=True)
