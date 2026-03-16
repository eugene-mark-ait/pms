from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Q

from .models import Complaint
from .serializers import ComplaintSerializer, ComplaintCreateSerializer
from accounts.permissions import IsPropertyOwnerOrManager


def _complaints_queryset(user):
    """Same visibility as list: tenant sees own; property owner/manager/caretaker see property-related."""
    if user.has_role("tenant"):
        return Complaint.objects.filter(tenant=user)
    return Complaint.objects.filter(
        Q(property__property_owner=user)
        | Q(property__manager_assignments__manager=user)
        | Q(property__caretaker_assignments__caretaker=user)
    ).distinct()


class ComplaintOpenCountView(APIView):
    """GET /api/complaints/open_count/ - count of open complaints (status != closed) for sidebar badge."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = _complaints_queryset(request.user).exclude(status=Complaint.Status.CLOSED)
        return Response({"count": qs.count()})


class ComplaintListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/complaints/ - list or create complaints. Tenant chooses assignee (caretaker/manager/property owner)."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return ComplaintCreateSerializer
        return ComplaintSerializer

    def get_queryset(self):
        return _complaints_queryset(self.request.user).select_related("property", "unit", "unit__property", "tenant", "assigned_to")

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user)


class ComplaintDetailView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/complaints/<id>/ - retrieve or update (status, priority, assigned_to)."""
    permission_classes = [IsAuthenticated]
    serializer_class = ComplaintSerializer

    def get_queryset(self):
        return _complaints_queryset(self.request.user).select_related("property", "unit", "unit__property", "tenant", "assigned_to")
