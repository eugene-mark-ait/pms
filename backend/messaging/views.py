from django.db.models import Q
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Message
from .serializers import MessageSerializer


class MessageListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/messages/ - list or send messages."""
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        user = self.request.user
        return Message.objects.filter(
            Q(sender=user) | Q(recipient=user)
        ).select_related("sender", "recipient", "property").order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)
