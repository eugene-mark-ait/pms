from datetime import date as date_type

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from accounts.models import Role
from .models import Lease, LeaseHistory, TenantProfile, EvictionNotice
from vacancies.views import process_due_notices
from vacancies.models import VacateNotice, VacancyListing
from .serializers import (
    LeaseSerializer,
    LeaseCreateUpdateSerializer,
    GiveNoticeSerializer,
    GiveEvictionSerializer,
)
from .services import (
    get_next_rent_due_date,
    get_outstanding_balance,
    get_payment_status,
    get_last_payment_end,
)
from accounts.permissions import IsLandlordOrManager, IsLandlordOrManagerOrCaretaker, IsTenant
from notifications.models import Notification


def process_due_evictions():
    """When an eviction notice's move-out deadline is today or in the past, mark the unit vacant, end the lease, create lease history, and mark the eviction as fulfilled (cancelled)."""
    today = date_type.today()
    due = EvictionNotice.objects.filter(
        cancelled=False,
        move_out_deadline__lte=today,
    ).select_related("lease", "lease__unit", "lease__tenant")
    for eviction in due:
        lease = eviction.lease
        unit = lease.unit
        move_out = eviction.move_out_deadline
        notice_date = eviction.created_at.date() if eviction.created_at else None
        LeaseHistory.objects.get_or_create(
            tenant=lease.tenant,
            unit=unit,
            move_out_date=move_out,
            defaults={
                "lease_start_date": lease.start_date,
                "lease_end_date": lease.end_date,
                "notice_date": notice_date,
            },
        )
        unit.is_vacant = True
        unit.save(update_fields=["is_vacant", "updated_at"])
        lease.is_active = False
        lease.save(update_fields=["is_active", "updated_at"])
        eviction.cancelled = True
        eviction.save(update_fields=["cancelled", "updated_at"])


def tenant_leases_queryset(user):
    return Lease.objects.filter(tenant=user, is_active=True).select_related(
        "unit", "unit__property"
    )


class LeaseListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/leases/ - list or create leases (landlord/manager/caretaker)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]

    def get_queryset(self):
        process_due_notices()
        process_due_evictions()
        user = self.request.user
        if user.has_role("landlord"):
            qs = Lease.objects.filter(unit__property__landlord=user).select_related("unit", "unit__property", "tenant")
        elif user.has_role("manager"):
            qs = Lease.objects.filter(unit__property__manager_assignments__manager=user).select_related("unit", "unit__property", "tenant").distinct()
        elif user.has_role("caretaker"):
            qs = Lease.objects.filter(unit__property__caretaker_assignments__caretaker=user).select_related("unit", "unit__property", "tenant").distinct()
        else:
            return Lease.objects.none()
        is_active = self.request.query_params.get("is_active")
        if is_active is not None:
            if is_active.lower() in ("true", "1", "yes"):
                qs = qs.filter(is_active=True)
            elif is_active.lower() in ("false", "0", "no"):
                qs = qs.filter(is_active=False)
        unit_id = self.request.query_params.get("unit")
        if unit_id:
            qs = qs.filter(unit_id=unit_id)
        # Tenant search: email, phone, or name (first/last)
        search = (self.request.query_params.get("search") or "").strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(tenant__email__icontains=search)
                | Q(tenant__first_name__icontains=search)
                | Q(tenant__last_name__icontains=search)
                | Q(tenant__phone__icontains=search)
            ).distinct()
        return qs.order_by("-start_date")

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
    """GET/PUT/PATCH/DELETE /api/leases/<id>/ - caretaker can view and update, not delete."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = LeaseSerializer

    def get_queryset(self):
        process_due_evictions()
        user = self.request.user
        if user.has_role("landlord"):
            return Lease.objects.filter(unit__property__landlord=user)
        if user.has_role("manager"):
            return Lease.objects.filter(unit__property__manager_assignments__manager=user)
        if user.has_role("caretaker"):
            return Lease.objects.filter(unit__property__caretaker_assignments__caretaker=user).distinct()
        return Lease.objects.none()

    def destroy(self, request, *args, **kwargs):
        if request.user.has_role("caretaker"):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Caretakers cannot delete leases.")
        return super().destroy(request, *args, **kwargs)


class TenantMyUnitsView(generics.ListAPIView):
    """GET /api/tenant/my-units/ - tenant's active leases with rent info."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = LeaseSerializer

    def get_queryset(self):
        process_due_evictions()
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

        from vacancies.notification_service import notify_subscribers
        notify_subscribers(lease.unit, available_from=move_out_date)

        # If notice end date is today or in the past, create history, mark unit vacant and close lease
        from datetime import date as date_type
        if move_out_date <= date_type.today():
            notice_date = notice.created_at.date() if notice.created_at else None
            LeaseHistory.objects.get_or_create(
                tenant=lease.tenant,
                unit=lease.unit,
                move_out_date=move_out_date,
                defaults={
                    "lease_start_date": lease.start_date,
                    "lease_end_date": lease.end_date,
                    "notice_date": notice_date,
                },
            )
            lease.unit.is_vacant = True
            lease.unit.save(update_fields=["is_vacant", "updated_at"])
            lease.is_active = False
            lease.save(update_fields=["is_active", "updated_at"])

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


class CreateEvictionView(generics.GenericAPIView):
    """POST /api/leases/<lease_id>/eviction/ - landlord issues eviction notice."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]
    serializer_class = GiveEvictionSerializer

    def get_lease(self, pk):
        user = self.request.user
        qs = Lease.objects.filter(is_active=True)
        if user.has_role("landlord"):
            qs = qs.filter(unit__property__landlord=user)
        elif user.has_role("manager"):
            qs = qs.filter(unit__property__manager_assignments__manager=user).distinct()
        else:
            return None
        return get_object_or_404(qs, pk=pk)

    def post(self, request, pk):
        lease = self.get_lease(pk)
        serializer = GiveEvictionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        if str(lease.id) != str(data["lease_id"]):
            return Response(
                {"error": "lease_id does not match URL."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        # Deactivate any existing active eviction for this lease
        EvictionNotice.objects.filter(lease=lease, cancelled=False).update(cancelled=True)
        eviction = EvictionNotice.objects.create(
            lease=lease,
            reason=data["eviction_reason"],
            move_out_deadline=data["eviction_date"],
            optional_notes=data.get("optional_notes", "") or "",
        )
        return Response(
            {"success": True, "eviction_id": str(eviction.id)},
            status=status.HTTP_201_CREATED,
        )


class CancelEvictionView(generics.GenericAPIView):
    """POST /api/leases/<lease_id>/eviction/cancel/ - landlord cancels active eviction."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]

    def get_lease(self, pk):
        user = self.request.user
        qs = Lease.objects.all()
        if user.has_role("landlord"):
            qs = qs.filter(unit__property__landlord=user)
        elif user.has_role("manager"):
            qs = qs.filter(unit__property__manager_assignments__manager=user).distinct()
        else:
            return None
        return get_object_or_404(qs, pk=pk)

    def post(self, request, pk):
        lease = self.get_lease(pk)
        updated = EvictionNotice.objects.filter(lease=lease, cancelled=False).update(cancelled=True)
        return Response(
            {"success": True, "cancelled": updated > 0},
            status=status.HTTP_200_OK,
        )
