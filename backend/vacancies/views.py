from datetime import date as date_type
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404

from leases.models import LeaseHistory
from .models import VacateNotice, VacancyListing, TenantVacancyPreference, UnitVacancyInfo, UnitNotificationSubscription, UnitApplication
from .serializers import (
    VacancyListingSerializer,
    VacancySearchSerializer,
    TenantVacancyPreferenceSerializer,
    VacancyDiscoverySerializer,
    VacancyNotifySubscribeSerializer,
    MySubscriptionSerializer,
    UnitApplicationSerializer,
)
from .notification_service import count_subscriptions_matching_filters
from config.pagination import OptionalPageSizePagination
from accounts.permissions import IsLandlordOrManagerOrCaretaker, IsTenant
from properties.models import Unit, Property


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
        from .notification_service import notify_subscribers
        notify_subscribers(unit, available_from=move_out)


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
    """GET /api/vacancies/search/?unit_type=&location=&min_rent=&max_rent=&page=&page_size= - discoverable vacancies (paginated)."""
    permission_classes = [AllowAny]
    serializer_class = VacancyDiscoverySerializer
    pagination_class = OptionalPageSizePagination

    def get_queryset(self):
        from django.db.models import Q
        qs = (
            Unit.objects.filter(
                is_vacant=True,
                is_reserved=False,
                property__is_closed=False,
            )
            .select_related("property")
            .prefetch_related("images", "property__images", "property__rules")
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

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        unit_type = (request.query_params.get("unit_type") or "").strip()
        location = (request.query_params.get("location") or "").strip()
        min_rent = (request.query_params.get("min_rent") or "").strip()
        max_rent = (request.query_params.get("max_rent") or "").strip()
        subscribers_waiting = count_subscriptions_matching_filters(unit_type, location, min_rent, max_rent)
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = self.get_paginated_response(serializer.data).data
            data["units_found"] = data.get("count", len(serializer.data))
            data["subscribers_waiting"] = subscribers_waiting
            return Response(data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "results": serializer.data,
            "count": len(serializer.data),
            "units_found": len(serializer.data),
            "subscribers_waiting": subscribers_waiting,
        })


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
            ).select_related("property").prefetch_related("images", "property__images", "property__rules"),
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
        process_due_notices()
        pref = TenantVacancyPreference.objects.filter(user=self.request.user).first()
        if not pref or not pref.is_looking:
            return Unit.objects.none()
        qs = (
            Unit.objects.filter(
                is_vacant=True,
                is_reserved=False,
                property__is_closed=False,
            )
            .select_related("property")
            .prefetch_related("images", "property__images", "property__rules")
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


class NotifySubscribeView(APIView):
    """POST /api/vacancies/notify-subscribe/ - subscribe to vacancy notifications (email, optional phone, search_filters). AllowAny. If authenticated, user is linked."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = VacancyNotifySubscribeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data.copy()
        if request.user.is_authenticated:
            data["user"] = request.user
            data.setdefault("email", request.user.email)
        subscription = UnitNotificationSubscription.objects.create(**data)
        out_serializer = VacancyNotifySubscribeSerializer(subscription)
        return Response(out_serializer.data, status=status.HTTP_201_CREATED)


class MySubscriptionsView(generics.ListAPIView):
    """GET /api/vacancies/my-subscriptions/?page=&page_size= - list current user's vacancy notification subscriptions (tenant), paginated."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = MySubscriptionSerializer
    pagination_class = OptionalPageSizePagination

    def get_queryset(self):
        return UnitNotificationSubscription.objects.filter(user=self.request.user).order_by("-created_at")


class DeleteSubscriptionView(APIView):
    """DELETE /api/vacancies/notify-subscribe/<id>/ - delete a subscription. Tenant only; must own the subscription (user or email match)."""
    permission_classes = [IsAuthenticated, IsTenant]

    def delete(self, request, pk):
        sub = get_object_or_404(UnitNotificationSubscription, pk=pk)
        if sub.user_id != request.user.id and sub.email != request.user.email:
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        sub.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


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


def _unit_queryset_landlord_or_manager(request):
    """Units the user can manage (landlord or manager)."""
    user = request.user
    if user.has_role("landlord"):
        return Unit.objects.filter(property__landlord=user)
    if user.has_role("manager"):
        return Unit.objects.filter(property__manager_assignments__manager=user).distinct()
    return Unit.objects.none()


class UnitApplyView(APIView):
    """POST /api/vacancies/units/<unit_id>/apply/ - tenant applies for a unit (joins queue)."""
    permission_classes = [IsAuthenticated, IsTenant]

    def post(self, request, unit_id):
        unit = get_object_or_404(
            Unit.objects.filter(
                is_vacant=True,
                is_reserved=False,
                property__is_closed=False,
            ),
            pk=unit_id,
        )
        app, created = UnitApplication.objects.get_or_create(
            unit=unit,
            applicant=request.user,
            defaults={"status": UnitApplication.Status.WAITING},
        )
        if not created:
            if app.status == UnitApplication.Status.WAITING:
                return Response(UnitApplicationSerializer(app).data, status=status.HTTP_200_OK)
            return Response(
                {"detail": "You already have an application for this unit."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(UnitApplicationSerializer(app).data, status=status.HTTP_201_CREATED)


class UnitApplicationListView(generics.ListAPIView):
    """GET /api/vacancies/units/<unit_id>/applications/ - list queue for unit (landlord/manager)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]
    serializer_class = UnitApplicationSerializer
    pagination_class = None

    def get_queryset(self):
        unit_id = self.kwargs["unit_id"]
        qs = _unit_queryset_landlord_or_manager(self.request).filter(pk=unit_id)
        if not qs.exists():
            return UnitApplication.objects.none()
        return UnitApplication.objects.filter(unit_id=unit_id).select_related("applicant", "unit", "unit__property").order_by("created_at")


class ApplicationApproveView(APIView):
    """POST /api/vacancies/applications/<id>/approve/ - landlord/manager approve application; unit becomes reserved."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]

    def post(self, request, pk):
        app = get_object_or_404(UnitApplication, pk=pk, status=UnitApplication.Status.WAITING)
        if not _unit_queryset_landlord_or_manager(request).filter(pk=app.unit_id).exists():
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        app.status = UnitApplication.Status.APPROVED
        app.save(update_fields=["status", "updated_at"])
        app.unit.is_reserved = True
        app.unit.save(update_fields=["is_reserved", "updated_at"])
        # Notify others in queue that unit is no longer available (stub: could send email/notification)
        waiting = UnitApplication.objects.filter(unit=app.unit, status=UnitApplication.Status.WAITING).exclude(pk=app.pk)
        for w in waiting:
            pass  # TODO: notify w.applicant
        return Response(UnitApplicationSerializer(app).data)


class ApplicationDeclineView(APIView):
    """POST /api/vacancies/applications/<id>/decline/ - landlord/manager decline application."""
    permission_classes = [IsAuthenticated, IsLandlordOrManagerOrCaretaker]

    def post(self, request, pk):
        app = get_object_or_404(UnitApplication, pk=pk, status=UnitApplication.Status.WAITING)
        if not _unit_queryset_landlord_or_manager(request).filter(pk=app.unit_id).exists():
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        app.status = UnitApplication.Status.DECLINED
        app.save(update_fields=["status", "updated_at"])
        return Response(UnitApplicationSerializer(app).data)
