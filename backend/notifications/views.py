from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Notification
from .serializers import NotificationSerializer


class NotificationListView(generics.ListAPIView):
    """GET /api/notifications/ - current user's notifications."""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by("-created_at")


class NotificationDetailView(generics.RetrieveAPIView):
    """GET /api/notifications/<id>/ - mark as read on retrieve."""
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        from django.utils import timezone
        instance = self.get_object()
        if not instance.read_at:
            instance.read_at = timezone.now()
            instance.save(update_fields=["read_at"])
        serializer = self.get_serializer(instance)
        return Response(serializer.data)


from rest_framework.response import Response
