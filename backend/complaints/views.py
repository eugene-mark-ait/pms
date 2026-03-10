from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from .models import Complaint
from .serializers import ComplaintSerializer, ComplaintCreateSerializer
from accounts.permissions import IsLandlordOrManager


class ComplaintListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/complaints/ - list or create complaints. Tenant chooses assignee (caretaker/manager/landlord)."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("tenant"):
            return Complaint.objects.filter(tenant=user).select_related("property", "unit", "tenant", "assigned_to")
        return Complaint.objects.filter(
            Q(property__landlord=user)
            | Q(property__manager_assignments__manager=user)
            | Q(property__caretaker_assignments__caretaker=user)
        ).distinct().select_related("property", "unit", "tenant", "assigned_to")

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)


class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/complaints/<id>/ - retrieve or update (status, priority, assigned_to)."""
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("tenant"):
            return Complaint.objects.filter(tenant=user).select_related("property", "unit", "tenant", "assigned_to")
        return Complaint.objects.filter(
            Q(property__landlord=user)
            | Q(property__manager_assignments__manager=user)
            | Q(property__caretaker_assignments__caretaker=user)
        ).distinct().select_related("property", "unit", "tenant", "assigned_to")
