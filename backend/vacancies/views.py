from datetime import date as date_type
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404

from leases.models import LeaseHistory
from .models import VacateNotice, VacancyListing, TenantVacancyPreference, UnitVacancyInfo
from .serializers import (
    VacancyListingSerializer,
    VacancySearchSerializer,
    TenantVacancyPreferenceSerializer,
    VacancyDiscoverySerializer,
)
from accounts.permissions import IsLandlordOrManagerOrCaretaker, IsTenant
from properties.models import Unit


def process_due_notices():
    """For any vacate notice where move_out_date <= today and not cancelled, create lease history, mark unit vacant, close lease, mark listing filled."""
    today = date_type.today()
    listings = VacancyListing.objects.filter(
        is_filled=False,
        vacate_notice__move_out_date__lte=today,
        vacate_notice__notice_cancelled=False,
    ).select_related("vacate_notice", "vacate_notice__lease", "vacate_notice__lease__unit", "vacate_notice__lease__tenant")
    for listing in listings:
        notice = listing.vacate_notice
        if not notice or notice.notice_cancelled:
            continue
        lease = notice.lease
        unit = lease.unit
        move_out = notice.move_out_date
        notice_date = notice.created_at.date() if notice.created_at else None
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
        listing.is_filled = True
        listing.save(update_fields=["is_filled", "updated_at"])


class VacancyListingListView(generics.ListAPIView):
    """GET /api/vacancies/ - list upcoming vacancies (landlord/manager/caretaker). ?property=<uuid> filters by property."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = VacancyListingSerializer

    def get_queryset(self):
        process_due_notices()
        user = self.request.user
        qs = (
            VacancyListing.objects.filter(is_filled=False)
            .select_related("property", "unit", "vacate_notice", "vacate_notice__lease", "vacate_notice__lease__tenant")
        )
        if user.has_role("landlord"):
            qs = qs.filter(property__landlord=user)
        elif user.has_role("manager"):
            qs = qs.filter(property__manager_assignments__manager=user).distinct()
        elif user.has_role("caretaker"):
            qs = qs.filter(property__caretaker_assignments__caretaker=user).distinct()
        else:
            return qs.none()
        property_id = self.request.query_params.get("property")
        if property_id:
            qs = qs.filter(property_id=property_id)
        return qs.order_by("available_from")


class VacancySearchView(generics.ListAPIView):
    """GET /api/vacancies/search/?unit_type=&location=&min_rent=&max_rent= - discoverable vacancies (tenant or public). Only units with is_vacant=True, is_reserved=False."""
    permission_classes = [AllowAny]
    serializer_class = VacancyDiscoverySerializer
    pagination_class = None

    def get_queryset(self):
        from django.db.models import Q
        today = timezone.now().date()
        qs = (
            Unit.objects.filter(
                is_vacant=True,
                is_reserved=False,
                property__is_closed=False,
            )
            .select_related("property")
            .prefetch_related("images", "property__images")
        )
        unit_type = self.request.query_params.get("unit_type", "").strip()
        location = self.request.query_params.get("location", "").strip()
        min_rent = self.request.query_params.get("min_rent", "").strip()
        max_rent = self.request.query_params.get("max_rent", "").strip()
        if unit_type:
            qs = qs.filter(unit_type=unit_type)
        if location:
            qs = qs.filter(
                Q(property__location__icontains=location) | Q(property__address__icontains=location)
            )
        if min_rent:
            try:
                qs = qs.filter(monthly_rent__gte=float(min_rent))
            except ValueError:
                pass
        if max_rent:
            try:
                qs = qs.filter(monthly_rent__lte=float(max_rent))
            except ValueError:
                pass
        return qs.order_by("monthly_rent", "property__name", "unit_number")


class VacancyDiscoveryDetailView(generics.GenericAPIView):
    """GET /api/vacancies/discovery/<unit_id>/ - single discoverable vacancy with contact (respects visibility)."""
    permission_classes = [AllowAny]
    serializer_class = VacancyDiscoverySerializer

    def get_object(self):
        unit_id = self.kwargs["unit_id"]
        return get_object_or_404(
            Unit.objects.filter(
                is_vacant=True,
                is_reserved=False,
                property__is_closed=False,
            ).select_related("property").prefetch_related("images", "property__images"),
            id=unit_id,
        )

    def get(self, request, *args, **kwargs):
        unit = self.get_object()
        serializer = VacancyDiscoverySerializer(unit, context={"request": request})
        return Response(serializer.data)


class VacancyMatchesView(generics.ListAPIView):
    """GET /api/vacancies/matches/ - for tenants with is_looking=True, return vacancies matching preferred_unit_type and optional preferred_location."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = VacancyDiscoverySerializer
    pagination_class = None

    def get_queryset(self):
        from django.db.models import Q
        pref = TenantVacancyPreference.objects.filter(user=self.request.user).first()
        if not pref or not pref.is_looking:
            return Unit.objects.none()
        today = timezone.now().date()
        qs = (
            Unit.objects.filter(
                is_vacant=True,
                is_reserved=False,
                property__is_closed=False,
            )
            .select_related("property")
            .prefetch_related("images", "property__images")
        )
        if pref.preferred_unit_type:
            qs = qs.filter(unit_type=pref.preferred_unit_type)
        if pref.preferred_location and pref.preferred_location.strip():
            loc = pref.preferred_location.strip()
            qs = qs.filter(
                Q(property__location__icontains=loc) | Q(property__address__icontains=loc)
            )
        return qs.order_by("monthly_rent", "property__name", "unit_number")[:50]


class TenantVacancyPreferenceView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/vacancies/my-preference/ - tenant's vacancy search preferences (is_looking, unit type, location)."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = TenantVacancyPreferenceSerializer

    def get_object(self):
        pref, _ = TenantVacancyPreference.objects.get_or_create(user=self.request.user)
        return pref


class CancelNoticeView(APIView):
    """POST /api/vacancies/notice/<id>/cancel/ - tenant cancels their vacate notice. Only allowed before notice_due_date (move_out_date). Idempotent: already cancelled returns success."""
    permission_classes = [IsAuthenticated, IsTenant]

    def post(self, request, pk):
        from django.utils import timezone
        today = timezone.now().date()
        notice = VacateNotice.objects.filter(
            pk=pk,
            lease__tenant=request.user,
        ).first()
        if not notice:
            return Response(
                {"detail": "No vacate notice found."},
                status=status.HTTP_404_NOT_FOUND,
            )
        if notice.notice_cancelled:
            return Response({"success": True, "already_cancelled": True})
        if notice.move_out_date <= today:
            return Response(
                {"detail": "Cannot cancel notice after the due date has passed."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        notice.notice_cancelled = True
        notice.save(update_fields=["notice_cancelled"])
        listing = getattr(notice, "vacancy_listing", None)
        if listing:
            listing.is_filled = True
            listing.save(update_fields=["is_filled", "updated_at"])
        return Response({"success": True})
