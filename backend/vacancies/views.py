from datetime import date as date_type, timedelta
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Avg

from leases.models import LeaseHistory
from .models import VacateNotice, VacancyListing, TenantVacancyPreference, UnitVacancyInfo, UnitApplication, TenantUnitAlert
from .serializers import (
    VacancyListingSerializer,
    VacancySearchSerializer,
    TenantVacancyPreferenceSerializer,
    VacancyDiscoverySerializer,
    UnitApplicationSerializer,
    TenantUnitAlertSerializer,
    TenantScoreSerializer,
    VacancyPredictionSerializer,
    UnitTenantRankingSerializer,
    UnitAllocationReservationSerializer,
)
from config.pagination import OptionalPageSizePagination
from accounts.permissions import IsPropertyOwnerOrManagerOrCaretaker, IsTenant
from properties.models import Unit, Property
from marketplace.models import ServiceRequest, ServiceReview
from payments.models import Payment
from complaints.models import Complaint
from .models import TenantScore, VacancyPrediction, UnitTenantRanking, UnitAllocationReservation


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
    """GET /api/vacancies/ - list upcoming vacancies (property owner/manager/caretaker). ?property=<uuid> filters by property."""
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrManagerOrCaretaker]
    serializer_class = VacancyListingSerializer

    def get_queryset(self):
        process_due_notices()
        user = self.request.user
        qs = (
            VacancyListing.objects.filter(is_filled=False)
            .select_related("property", "unit", "vacate_notice", "vacate_notice__lease", "vacate_notice__lease__tenant")
        )
        if user.has_role("property_owner"):
            qs = qs.filter(property__property_owner=user)
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
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            data = self.get_paginated_response(serializer.data).data
            data["units_found"] = data.get("count", len(serializer.data))
            return Response(data)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "results": serializer.data,
            "count": len(serializer.data),
            "units_found": len(serializer.data),
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


def _unit_queryset_property_owner_or_manager(request):
    """Units the user can manage (property owner or manager)."""
    user = request.user
    if user.has_role("property_owner"):
        return Unit.objects.filter(property__property_owner=user)
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
    """GET /api/vacancies/units/<unit_id>/applications/ - list queue for unit (property owner/manager)."""
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrManagerOrCaretaker]
    serializer_class = UnitApplicationSerializer
    pagination_class = None

    def get_queryset(self):
        unit_id = self.kwargs["unit_id"]
        qs = _unit_queryset_property_owner_or_manager(self.request).filter(pk=unit_id)
        if not qs.exists():
            return UnitApplication.objects.none()
        return UnitApplication.objects.filter(unit_id=unit_id).select_related("applicant", "unit", "unit__property").order_by("created_at")


class ApplicationApproveView(APIView):
    """POST /api/vacancies/applications/<id>/approve/ - property owner/manager approve application; unit becomes reserved."""
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrManagerOrCaretaker]

    def post(self, request, pk):
        app = get_object_or_404(UnitApplication, pk=pk, status=UnitApplication.Status.WAITING)
        if not _unit_queryset_property_owner_or_manager(request).filter(pk=app.unit_id).exists():
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
    """POST /api/vacancies/applications/<id>/decline/ - property owner/manager decline application."""
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrManagerOrCaretaker]

    def post(self, request, pk):
        app = get_object_or_404(UnitApplication, pk=pk, status=UnitApplication.Status.WAITING)
        if not _unit_queryset_property_owner_or_manager(request).filter(pk=app.unit_id).exists():
            return Response({"detail": "Not found."}, status=status.HTTP_404_NOT_FOUND)
        app.status = UnitApplication.Status.DECLINED
        app.save(update_fields=["status", "updated_at"])
        return Response(UnitApplicationSerializer(app).data)


class TenantUnitAlertListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/vacancies/alerts/ - list and create tenant unit alerts (tenant only). Paginated list."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = TenantUnitAlertSerializer
    pagination_class = OptionalPageSizePagination

    def get_queryset(self):
        return TenantUnitAlert.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TenantUnitAlertDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PUT/PATCH/DELETE /api/vacancies/alerts/<id>/ - retrieve, update, or delete an alert (owner only)."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = TenantUnitAlertSerializer

    def get_queryset(self):
        return TenantUnitAlert.objects.filter(user=self.request.user)


def _clamp(value, lower=0, upper=100):
    return max(lower, min(upper, int(round(value))))


def recompute_tenant_score(tenant):
    """Compute platform-native tenant score using local payment/complaint/service data."""
    completed_payments = Payment.objects.filter(
        lease__tenant=tenant,
        payment_status=Payment.PaymentStatus.COMPLETED,
    ).count()
    failed_payments = Payment.objects.filter(
        lease__tenant=tenant,
        payment_status=Payment.PaymentStatus.FAILED,
    ).count()
    payment_consistency = _clamp(50 + (completed_payments * 3) - (failed_payments * 8))

    open_complaints = Complaint.objects.filter(tenant=tenant, status__in=["open", "in_progress"]).count()
    resolved_complaints = Complaint.objects.filter(tenant=tenant, status__in=["resolved", "closed"]).count()
    maintenance_behavior = _clamp(70 + (resolved_complaints * 2) - (open_complaints * 12))
    dispute_history = _clamp(100 - (open_complaints * 15))

    service_requests = ServiceRequest.objects.filter(user=tenant).count()
    cancelled_requests = ServiceRequest.objects.filter(user=tenant, status=ServiceRequest.Status.CANCELLED).count()
    service_reliability = _clamp(70 + (service_requests * 2) - (cancelled_requests * 8))

    landlord_rating_avg = ServiceReview.objects.filter(user=tenant).aggregate(avg=Avg("rating")).get("avg")
    landlord_rating = _clamp((float(landlord_rating_avg or 3.5) / 5.0) * 100)

    weighted_percent = (
        0.35 * payment_consistency
        + 0.20 * maintenance_behavior
        + 0.15 * service_reliability
        + 0.15 * landlord_rating
        + 0.15 * dispute_history
    )
    overall_score = _clamp(300 + (weighted_percent / 100.0) * 600, 300, 900)
    explainability = {
        "completed_payments": completed_payments,
        "failed_payments": failed_payments,
        "open_complaints": open_complaints,
        "resolved_complaints": resolved_complaints,
        "service_requests": service_requests,
        "cancelled_requests": cancelled_requests,
    }
    score_obj, _ = TenantScore.objects.update_or_create(
        tenant=tenant,
        defaults={
            "overall_score": overall_score,
            "payment_consistency": payment_consistency,
            "maintenance_behavior": maintenance_behavior,
            "service_reliability": service_reliability,
            "landlord_rating": landlord_rating,
            "dispute_history": dispute_history,
            "explainability": explainability,
        },
    )
    return score_obj


def predict_unit_vacancy(unit):
    """Predict likely vacancy date for active lease and store the latest prediction."""
    from leases.models import Lease
    active_lease = Lease.objects.filter(unit=unit, is_active=True).order_by("end_date").first()
    if not active_lease:
        return None

    today = timezone.now().date()
    days_to_end = (active_lease.end_date - today).days
    failed_payments = Payment.objects.filter(
        lease=active_lease,
        payment_status=Payment.PaymentStatus.FAILED,
    ).count()
    open_complaints = Complaint.objects.filter(
        lease=active_lease,
        status__in=[Complaint.Status.OPEN, Complaint.Status.IN_PROGRESS],
    ).count()

    risk_points = 0
    factors = []
    if days_to_end <= 90:
        risk_points += 40
        factors.append("lease_expiry_within_90_days")
    if failed_payments > 0:
        risk_points += min(30, failed_payments * 10)
        factors.append("failed_payments_detected")
    if open_complaints > 0:
        risk_points += min(20, open_complaints * 8)
        factors.append("active_complaints")

    confidence = min(0.95, max(0.10, risk_points / 100.0))
    if days_to_end <= 0:
        predicted_date = today
    elif risk_points >= 60:
        predicted_date = today + timedelta(days=min(max(days_to_end, 7), 45))
    else:
        predicted_date = active_lease.end_date

    risk_level = "high" if risk_points >= 70 else "medium" if risk_points >= 40 else "low"
    prediction, _ = VacancyPrediction.objects.update_or_create(
        unit=unit,
        defaults={
            "lease": active_lease,
            "predicted_vacancy_date": predicted_date,
            "confidence": confidence,
            "risk_level": risk_level,
            "factors": factors,
        },
    )
    return prediction


def build_unit_rankings(unit):
    """Build dynamic priority queue from applications and tenant score."""
    now = timezone.now()
    UnitTenantRanking.objects.filter(unit=unit).delete()
    waiting_apps = UnitApplication.objects.filter(unit=unit, status=UnitApplication.Status.WAITING).select_related("applicant")
    ranked = []
    for app in waiting_apps:
        score_obj = recompute_tenant_score(app.applicant)
        latest_alert = (
            TenantUnitAlert.objects.filter(user=app.applicant, is_active=True)
            .order_by("-updated_at")
            .first()
        )
        budget_alignment = 80
        if latest_alert and latest_alert.max_rent is not None:
            budget_alignment = 100 if app.unit.monthly_rent <= latest_alert.max_rent else 40
        elif latest_alert and latest_alert.min_rent is not None:
            budget_alignment = 100 if app.unit.monthly_rent >= latest_alert.min_rent else 60
        total = (0.60 * score_obj.overall_score) + (0.40 * budget_alignment)
        reasons = ["tenant_platform_score", "application_recency"]
        ranked.append((app, total, reasons))
    ranked.sort(key=lambda x: x[1], reverse=True)
    for idx, (app, total, reasons) in enumerate(ranked, start=1):
        UnitTenantRanking.objects.create(
            unit=unit,
            tenant=app.applicant,
            score=total,
            rank=idx,
            reason_codes=reasons,
            generated_at=now,
        )
    return UnitTenantRanking.objects.filter(unit=unit).order_by("rank")


class TenantScoreView(APIView):
    """GET /api/vacancies/tenant-score/me/ - compute and return current tenant score."""
    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request):
        score_obj = recompute_tenant_score(request.user)
        return Response(TenantScoreSerializer(score_obj).data)


class VacancyForecastView(APIView):
    """GET /api/vacancies/units/<unit_id>/vacancy-forecast/ - retrieve unit vacancy prediction."""
    permission_classes = [IsAuthenticated]

    def get(self, request, unit_id):
        unit = get_object_or_404(Unit, pk=unit_id)
        prediction = predict_unit_vacancy(unit)
        if not prediction:
            return Response({"detail": "No active lease to predict from."}, status=status.HTTP_404_NOT_FOUND)
        return Response(VacancyPredictionSerializer(prediction).data)


class UnitRankedTenantsView(APIView):
    """GET /api/vacancies/units/<unit_id>/ranked-tenants/ - dynamic tenant ranking queue for a unit."""
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrManagerOrCaretaker]

    def get(self, request, unit_id):
        unit = get_object_or_404(_unit_queryset_property_owner_or_manager(request), pk=unit_id)
        rankings = build_unit_rankings(unit)
        return Response({"results": UnitTenantRankingSerializer(rankings, many=True).data, "count": rankings.count()})


class UnitAllocateNextView(APIView):
    """POST /api/vacancies/units/<unit_id>/allocate-next/ - reserve the unit for the next top-ranked tenant."""
    permission_classes = [IsAuthenticated, IsPropertyOwnerOrManagerOrCaretaker]

    def post(self, request, unit_id):
        unit = get_object_or_404(_unit_queryset_property_owner_or_manager(request), pk=unit_id)
        window_minutes = int(request.data.get("window_minutes", 120))
        now = timezone.now()
        UnitAllocationReservation.objects.filter(
            unit=unit,
            status=UnitAllocationReservation.Status.ACTIVE,
            window_end__lt=now,
        ).update(status=UnitAllocationReservation.Status.EXPIRED, updated_at=now)
        if UnitAllocationReservation.objects.filter(
            unit=unit,
            status=UnitAllocationReservation.Status.ACTIVE,
            window_end__gte=now,
        ).exists():
            active = UnitAllocationReservation.objects.filter(
                unit=unit,
                status=UnitAllocationReservation.Status.ACTIVE,
                window_end__gte=now,
            ).order_by("-created_at").first()
            return Response(UnitAllocationReservationSerializer(active).data, status=status.HTTP_200_OK)

        rankings = build_unit_rankings(unit)
        for ranking in rankings:
            already = UnitAllocationReservation.objects.filter(
                unit=unit,
                tenant=ranking.tenant,
                status__in=[
                    UnitAllocationReservation.Status.ACTIVE,
                    UnitAllocationReservation.Status.ACCEPTED,
                ],
                window_end__gte=now,
            ).exists()
            if already:
                continue
            reservation = UnitAllocationReservation.objects.create(
                unit=unit,
                tenant=ranking.tenant,
                ranking=ranking,
                status=UnitAllocationReservation.Status.ACTIVE,
                window_start=now,
                window_end=now + timedelta(minutes=max(15, min(window_minutes, 1440))),
            )
            return Response(UnitAllocationReservationSerializer(reservation).data, status=status.HTTP_201_CREATED)
        return Response({"detail": "No ranked tenant available for reservation."}, status=status.HTTP_404_NOT_FOUND)
