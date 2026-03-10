from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from accounts.models import Role
from .models import Lease, TenantProfile
from vacancies.models import VacateNotice, VacancyListing
from .serializers import (
    LeaseSerializer,
    LeaseCreateUpdateSerializer,
    GiveNoticeSerializer,
)
from .services import (
    get_next_rent_due_date,
    get_outstanding_balance,
    get_payment_status,
    get_last_payment_end,
)
from accounts.permissions import IsLandlordOrManager, IsTenant
from notifications.models import Notification


def tenant_leases_queryset(user):
    return Lease.objects.filter(tenant=user, is_active=True).select_related(
        "unit", "unit__property"
    )


class LeaseListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/leases/ - list or create leases (landlord/manager)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Lease.objects.filter(unit__property__landlord=user).select_related("unit", "unit__property", "tenant")
        if user.has_role("manager"):
            return Lease.objects.filter(unit__property__manager_assignments__manager=user).select_related("unit", "unit__property", "tenant").distinct()
        return Lease.objects.none()

    def get_serializer_class(self):
        if self.request.method == "POST":
            return LeaseCreateUpdateSerializer
        return LeaseSerializer

    def perform_create(self, serializer):
        lease = serializer.save()
        lease.unit.is_vacant = False
        lease.unit.save(update_fields=["is_vacant", "updated_at"])
        tenant_user = lease.tenant
        tenant_role, _ = Role.objects.get_or_create(name="tenant")
        if not tenant_user.roles.filter(pk=tenant_role.pk).exists():
            tenant_user.roles.add(tenant_role)
        TenantProfile.objects.get_or_create(user=tenant_user)


class LeaseDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/leases/<id>/"""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]
    serializer_class = LeaseSerializer

    def get_queryset(self):
        user = self.request.user
        if user.has_role("landlord"):
            return Lease.objects.filter(unit__property__landlord=user)
        if user.has_role("manager"):
            return Lease.objects.filter(unit__property__manager_assignments__manager=user)
        return Lease.objects.none()


class TenantMyUnitsView(generics.ListAPIView):
    """GET /api/tenant/my-units/ - tenant's active leases with rent info."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = LeaseSerializer

    def get_queryset(self):
        return tenant_leases_queryset(self.request.user)


class GiveNoticeView(generics.GenericAPIView):
    """POST /api/leases/give-notice/ - tenant submits vacate notice."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = GiveNoticeSerializer

    def post(self, request):
        serializer = GiveNoticeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        move_out_date = data["move_out_date"]
        reason = data.get("reason", "")
        notice_message = data.get("notice_message", "")

        # Require lease_id in body so we know which lease
        lease_id = request.data.get("lease_id")
        if not lease_id:
            return Response(
                {"error": "lease_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        lease = get_object_or_404(
            Lease,
            id=lease_id,
            tenant=request.user,
            is_active=True,
        )

        notice = VacateNotice.objects.create(
            lease=lease,
            move_out_date=move_out_date,
            reason=reason,
            notice_message=notice_message,
        )

        VacancyListing.objects.create(
            property=lease.unit.property,
            unit=lease.unit,
            vacate_notice=notice,
            available_from=move_out_date,
        )

        # Notify landlord and managers
        for u in [lease.unit.property.landlord]:
            Notification.objects.create(
                user=u,
                notification_type=Notification.NotificationType.VACATE_NOTICE,
                title="Vacate notice received",
                body=f"Tenant gave notice for unit {lease.unit.unit_number}. Move-out: {move_out_date}",
            )
        for ma in lease.unit.property.manager_assignments.all():
            Notification.objects.create(
                user=ma.manager,
                notification_type=Notification.NotificationType.VACATE_NOTICE,
                title="Vacate notice received",
                body=f"Tenant gave notice for unit {lease.unit.unit_number}. Move-out: {move_out_date}",
            )

        return Response(
            {"success": True, "vacate_notice_id": str(notice.id)},
            status=status.HTTP_201_CREATED,
        )
