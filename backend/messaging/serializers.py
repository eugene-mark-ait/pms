from rest_framework import serializers
from .models import Message
from accounts.serializers import UserSerializer


class MessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)

    class Meta:
        model = Message
        fields = ["id", "property", "sender", "recipient", "body", "read_at", "created_at"]
        read_only_fields = ["id", "sender", "created_at"]
