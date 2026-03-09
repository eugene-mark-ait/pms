from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import Complaint
from .serializers import ComplaintSerializer
from accounts.permissions import IsTenant, IsLandlordOrManager


class ComplaintListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/complaints/ - list or create complaints."""
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("tenant"):
            return Complaint.objects.filter(tenant=user).select_related("property", "unit")
        from django.db.models import Q
        return Complaint.objects.filter(
            Q(property__landlord=user) | Q(property__manager_assignments__manager=user)
        ).distinct().select_related("property", "unit", "tenant")

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)


class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/complaints/<id>/ - retrieve or update (status) complaint."""
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        if user.has_role("tenant"):
            return Complaint.objects.filter(tenant=user).select_related("property", "unit")
        return Complaint.objects.filter(
            Q(property__landlord=user) | Q(property__manager_assignments__manager=user)
        ).distinct().select_related("property", "unit", "tenant")
