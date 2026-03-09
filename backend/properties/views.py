from rest_framework import generics
from rest_framework.permissions import IsAuthenticated

from .models import Property, Unit, PropertyRule, ManagerAssignment
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    UnitSerializer,
    PropertyRuleSerializer,
    ManagerAssignmentSerializer,
)
from accounts.permissions import IsLandlord, IsLandlordOrManager


class PropertyListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/properties/ - list (filtered by role) or create properties."""
    permission_classes = [IsAuthenticated, IsLandlord]
    serializer_class = PropertyListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Property.objects.filter(landlord=user).order_by("-created_at")
        if user.has_role("manager"):
            return Property.objects.filter(manager_assignments__manager=user).distinct().order_by("-created_at")
        return Property.objects.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return PropertyListSerializer
        return PropertyListSerializer

    def perform_create(self, serializer):
        serializer.save(landlord=self.request.user)


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/properties/<id>/"""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]
    serializer_class = PropertyDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Property.objects.filter(landlord=user)
        if user.has_role("manager"):
            return Property.objects.filter(manager_assignments__manager=user)
        return Property.objects.none()


class UnitListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/units/ - list or create units (query: ?property=<id>)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]
    serializer_class = UnitSerializer

    def get_queryset(self):
        qs = Unit.objects.select_related("property").all()
        user = self.request.user
        if user.has_role("landlord"):
            qs = qs.filter(property__landlord=user)
        elif user.has_role("manager"):
            qs = qs.filter(property__manager_assignments__manager=user)
        else:
            qs = qs.none()
        property_id = self.request.query_params.get("property")
        if property_id:
            qs = qs.filter(property_id=property_id)
        return qs.distinct().order_by("property", "unit_number")

    def perform_create(self, serializer):
        serializer.save()


class UnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/units/<id>/"""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]
    serializer_class = UnitSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Unit.objects.filter(property__landlord=user)
        if user.has_role("manager"):
            return Unit.objects.filter(property__manager_assignments__manager=user)
        return Unit.objects.none()
