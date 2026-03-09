from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Property, Unit, PropertyRule, ManagerAssignment, CaretakerAssignment
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    UnitSerializer,
    PropertyRuleSerializer,
    ManagerAssignmentSerializer,
    CaretakerAssignmentSerializer,
    AssignManagerSerializer,
    AssignCaretakerSerializer,
)
from accounts.permissions import IsLandlord, IsLandlordOrManager

User = get_user_model()


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
            from .serializers import PropertyCreateUpdateSerializer
            return PropertyCreateUpdateSerializer
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


def _property_for_landlord(request, pk):
    """Return property if current user is the landlord."""
    return get_object_or_404(Property, pk=pk, landlord=request.user)


class PropertyManagerAddView(APIView):
    """POST /api/properties/<id>/managers/ - landlord adds a manager to the property."""
    permission_classes = [IsAuthenticated, IsLandlord]

    def post(self, request, pk):
        property_obj = _property_for_landlord(request, pk)
        serializer = AssignManagerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user_id"]
        user = get_object_or_404(User, pk=user_id)
        if not user.has_role("manager"):
            return Response(
                {"detail": "User must have the manager role. Assign it via /api/auth/assign-roles/ first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _, created = ManagerAssignment.objects.get_or_create(property=property_obj, manager=user)
        if not created:
            return Response(
                {"detail": "This manager is already assigned to the property."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            ManagerAssignmentSerializer(ManagerAssignment.objects.get(property=property_obj, manager=user)).data,
            status=status.HTTP_201_CREATED,
        )


class PropertyManagerRemoveView(APIView):
    """DELETE /api/properties/<id>/managers/<user_id>/ - landlord removes a manager."""
    permission_classes = [IsAuthenticated, IsLandlord]

    def delete(self, request, pk, user_id):
        property_obj = _property_for_landlord(request, pk)
        deleted, _ = ManagerAssignment.objects.filter(property=property_obj, manager_id=user_id).delete()
        if not deleted:
            return Response({"detail": "Manager assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PropertyCaretakerAddView(APIView):
    """POST /api/properties/<id>/caretakers/ - landlord adds a caretaker to the property."""
    permission_classes = [IsAuthenticated, IsLandlord]

    def post(self, request, pk):
        property_obj = _property_for_landlord(request, pk)
        serializer = AssignCaretakerSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user_id = serializer.validated_data["user_id"]
        user = get_object_or_404(User, pk=user_id)
        if not user.has_role("caretaker"):
            return Response(
                {"detail": "User must have the caretaker role. Assign it via /api/auth/assign-roles/ first."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        _, created = CaretakerAssignment.objects.get_or_create(property=property_obj, caretaker=user)
        if not created:
            return Response(
                {"detail": "This caretaker is already assigned to the property."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            CaretakerAssignmentSerializer(CaretakerAssignment.objects.get(property=property_obj, caretaker=user)).data,
            status=status.HTTP_201_CREATED,
        )


class PropertyCaretakerRemoveView(APIView):
    """DELETE /api/properties/<id>/caretakers/<user_id>/ - landlord removes a caretaker."""
    permission_classes = [IsAuthenticated, IsLandlord]

    def delete(self, request, pk, user_id):
        property_obj = _property_for_landlord(request, pk)
        deleted, _ = CaretakerAssignment.objects.filter(property=property_obj, caretaker_id=user_id).delete()
        if not deleted:
            return Response({"detail": "Caretaker assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
