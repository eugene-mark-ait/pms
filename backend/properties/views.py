from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from rest_framework.views import APIView
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model

from .models import Property, Unit, PropertyRule, ManagerAssignment, CaretakerAssignment, PropertyImage
from .serializers import (
    PropertyListSerializer,
    PropertyDetailSerializer,
    PropertyImageSerializer,
    PropertyOptionsSerializer,
    UnitSerializer,
    PropertyRuleSerializer,
    ManagerAssignmentSerializer,
    CaretakerAssignmentSerializer,
    AssignManagerSerializer,
    AssignCaretakerSerializer,
)
from accounts.permissions import IsLandlord, IsLandlordOrManager, IsLandlordOrManagerOrCaretaker
from leases.models import Lease

User = get_user_model()


class PropertyListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/properties/ - list (filtered by role) or create properties. Managers/caretakers can list assigned properties; only landlords can create."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = PropertyListSerializer

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user
        if user.has_role("landlord"):
            qs = Property.objects.filter(landlord=user)
        elif user.has_role("manager"):
            qs = Property.objects.filter(manager_assignments__manager=user).distinct()
        elif user.has_role("caretaker"):
            qs = Property.objects.filter(caretaker_assignments__caretaker=user).distinct()
        else:
            return Property.objects.none()
        # Search by property name or location (address/location fields)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(location__icontains=search)
                | Q(address__icontains=search)
            ).distinct()
        return qs.order_by("-created_at")

    def get_serializer_class(self):
        if self.request.method == "POST":
            from .serializers import PropertyCreateUpdateSerializer
            return PropertyCreateUpdateSerializer
        return PropertyListSerializer

    def perform_create(self, serializer):
        if not self.request.user.has_role("landlord"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only property owners can create properties.")
        serializer.save(landlord=self.request.user)


class PropertyOptionsView(generics.ListAPIView):
    """GET /api/properties/options/ - id and name only for dropdowns. No pagination; same permission as list."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = PropertyOptionsSerializer
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Property.objects.filter(landlord=user, is_closed=False).order_by("name")
        if user.has_role("manager"):
            return Property.objects.filter(manager_assignments__manager=user, is_closed=False).distinct().order_by("name")
        if user.has_role("caretaker"):
            return Property.objects.filter(caretaker_assignments__caretaker=user, is_closed=False).distinct().order_by("name")
        return Property.objects.none()


class PropertyDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/properties/<id>/ - caretaker can view only. Landlord/manager can PATCH is_closed to close property."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = PropertyDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Property.objects.filter(landlord=user)
        if user.has_role("manager"):
            return Property.objects.filter(manager_assignments__manager=user)
        if user.has_role("caretaker"):
            return Property.objects.filter(caretaker_assignments__caretaker=user).distinct()
        return Property.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot edit property details.")
        # Only landlord and manager can set is_closed (handled by serializer + same update path)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot delete properties.")
        return super().destroy(request, *args, **kwargs)


class UnitListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/units/ - list or create units (query: ?property=<id>)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = UnitSerializer

    def get_queryset(self):
        qs = Unit.objects.select_related("property").all()
        user = self.request.user
        if user.has_role("landlord"):
            qs = qs.filter(property__landlord=user)
        elif user.has_role("manager"):
            qs = qs.filter(property__manager_assignments__manager=user)
        elif user.has_role("caretaker"):
            qs = qs.filter(property__caretaker_assignments__caretaker=user)
        else:
            qs = qs.none()
        property_id = self.request.query_params.get("property")
        if property_id:
            qs = qs.filter(property_id=property_id)
        # Filter by unit name (unit_number)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            qs = qs.filter(unit_number__icontains=search)
        return qs.distinct().order_by("property", "unit_number")

    def perform_create(self, serializer):
        if self.request.user.has_role("caretaker"):
            raise PermissionDenied("Caretakers cannot create units.")
        serializer.save()


class UnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/units/<id>/"""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = UnitSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Unit.objects.filter(property__landlord=user)
        if user.has_role("manager"):
            return Unit.objects.filter(property__manager_assignments__manager=user)
        if user.has_role("caretaker"):
            return Unit.objects.filter(property__caretaker_assignments__caretaker=user).distinct()
        return Unit.objects.none()

    def update(self, request, *args, **kwargs):
        if request.user.has_role("caretaker"):
            raise PermissionDenied("Caretakers cannot edit units.")
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        if request.user.has_role("caretaker"):
            raise PermissionDenied("Caretakers cannot delete units.")
        return super().destroy(request, *args, **kwargs)


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


def _property_for_user(request, pk):
    """Return property if user is landlord, manager, or caretaker of it."""
    user = request.user
    qs = Property.objects.filter(pk=pk)
    if user.has_role("landlord"):
        qs = qs.filter(landlord=user)
    elif user.has_role("manager"):
        qs = qs.filter(manager_assignments__manager=user)
    elif user.has_role("caretaker"):
        qs = qs.filter(caretaker_assignments__caretaker=user)
    else:
        qs = qs.none()
    return get_object_or_404(qs.distinct())


class PropertyRuleListCreateView(APIView):
    """GET/POST /api/properties/<pk>/rules/ - list or create rules (landlord/manager only)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]

    def get(self, request, pk):
        property_obj = _property_for_user(request, pk)
        rules = property_obj.rules.all().order_by("created_at")
        return Response(PropertyRuleSerializer(rules, many=True).data)

    def post(self, request, pk):
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot add rules.")
        property_obj = _property_for_user(request, pk)
        serializer = PropertyRuleSerializer(data={**request.data, "property": str(property_obj.id)})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PropertyRuleDetailView(APIView):
    """PUT/PATCH/DELETE /api/properties/<pk>/rules/<rule_id>/ - update or delete a rule (landlord/manager only)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]

    def put(self, request, pk, rule_id):
        return self._update(request, pk, rule_id, partial=False)

    def patch(self, request, pk, rule_id):
        return self._update(request, pk, rule_id, partial=True)

    def _update(self, request, pk, rule_id, partial):
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot edit rules.")
        property_obj = _property_for_user(request, pk)
        rule = get_object_or_404(PropertyRule, pk=rule_id, property=property_obj)
        serializer = PropertyRuleSerializer(rule, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk, rule_id):
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot delete rules.")
        property_obj = _property_for_user(request, pk)
        rule = get_object_or_404(PropertyRule, pk=rule_id, property=property_obj)
        rule.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PropertyImageUploadView(APIView):
    """POST /api/properties/<id>/images/ - upload image (multipart). Landlord/manager only."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]

    def post(self, request, pk):
        property_obj = _property_for_user(request, pk)
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot add property images.")
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"detail": "No image file provided."}, status=status.HTTP_400_BAD_REQUEST)
        allowed = ["image/jpeg", "image/png", "image/webp"]
        if image_file.content_type not in allowed:
            return Response({"detail": "Only jpg, png, webp allowed."}, status=status.HTTP_400_BAD_REQUEST)
        sort_order = property_obj.images.count()
        obj = PropertyImage.objects.create(
            property=property_obj,
            image=image_file,
            caption=request.data.get("caption", ""),
            sort_order=sort_order,
        )
        request_ctx = self.request
        url = obj.image.url
        if request_ctx:
            url = request_ctx.build_absolute_uri(url)
        return Response(PropertyImageSerializer(obj).data, status=status.HTTP_201_CREATED)


class PropertyImageDeleteView(APIView):
    """DELETE /api/properties/<id>/images/<image_id>/"""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]

    def delete(self, request, pk, image_id):
        property_obj = _property_for_user(request, pk)
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot delete property images.")
        img = get_object_or_404(PropertyImage, pk=image_id, property=property_obj)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UnitBulkCreateView(APIView):
    """POST /api/units/bulk/ - create multiple units. Body: { property: "<uuid>", units: [{ unit_number, unit_type, monthly_rent, ... }] }."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]

    def post(self, request):
        property_id = request.data.get("property")
        units_data = request.data.get("units", [])
        if not property_id or not isinstance(units_data, list):
            return Response(
                {"detail": "Provide 'property' (uuid) and 'units' (array of { unit_number, unit_type, monthly_rent, ... })."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        property_obj = _property_for_user(request, property_id)
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot create units in bulk.")
        created = []
        errors = []
        for i, u in enumerate(units_data):
            data = {
                "property": str(property_obj.id),
                "unit_number": u.get("unit_number") or u.get("Unit Name") or "",
                "unit_type": u.get("unit_type") or u.get("Type") or "other",
                "monthly_rent": u.get("monthly_rent") or u.get("Rent") or u.get("rent") or "0",
                "security_deposit": u.get("security_deposit") or u.get("Deposit") or "0",
                "service_charge": u.get("service_charge") or "0",
                "extra_costs": u.get("extra_costs") or "",
                "payment_frequency": u.get("payment_frequency") or "monthly",
            }
            serializer = UnitSerializer(data=data)
            if serializer.is_valid():
                serializer.save()
                created.append(serializer.data)
            else:
                errors.append({i: serializer.errors})
        return Response({"created": len(created), "units": created, "errors": errors}, status=status.HTTP_201_CREATED)


class PropertyComplaintRecipientsView(APIView):
    """GET /api/properties/<id>/complaint-recipients/ - list users who can receive complaints (landlord, managers, caretakers) with role label. Tenant must have lease in this property; landlord/manager/caretaker must be assigned."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        prop = get_object_or_404(Property, pk=pk)
        user = request.user
        # Tenant: must have an active lease in this property
        if user.has_role("tenant"):
            if not Lease.objects.filter(tenant=user, unit__property=prop, is_active=True).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only file complaints for properties you rent in.")
        else:
            # Landlord / manager / caretaker: must be assigned to this property
            if user.has_role("landlord") and prop.landlord_id != user.id:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this property.")
            if user.has_role("manager") and not prop.manager_assignments.filter(manager=user).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this property.")
            if user.has_role("caretaker") and not prop.caretaker_assignments.filter(caretaker=user).exists():
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this property.")
            if not (user.has_role("landlord") or user.has_role("manager") or user.has_role("caretaker")):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You do not have access to this property.")

        out = []
        landlord = prop.landlord
        out.append({
            "id": str(landlord.id),
            "email": landlord.email,
            "first_name": landlord.first_name or "",
            "last_name": landlord.last_name or "",
            "role": "Landlord",
        })
        for ma in prop.manager_assignments.select_related("manager").all():
            m = ma.manager
            out.append({
                "id": str(m.id),
                "email": m.email,
                "first_name": m.first_name or "",
                "last_name": m.last_name or "",
                "role": "Manager",
            })
        for ca in prop.caretaker_assignments.select_related("caretaker").all():
            c = ca.caretaker
            out.append({
                "id": str(c.id),
                "email": c.email,
                "first_name": c.first_name or "",
                "last_name": c.last_name or "",
                "role": "Caretaker",
            })
        return Response(out)
