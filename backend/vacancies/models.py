import uuid
from django.db import models
from django.conf import settings
from properties.models import Property, Unit
from leases.models import Lease


class UnitVacancyInfo(models.Model):
    """Per-unit vacancy display settings when unit is vacant: availability date and which contacts to show to tenants."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.OneToOneField(
        Unit,
        on_delete=models.CASCADE,
        related_name="vacancy_info",
    )
    available_from = models.DateField(help_text="Date from which the unit is available.")
    show_property_owner_phone = models.BooleanField(default=False)
    show_manager_phone = models.BooleanField(default=False)
    show_caretaker_phone = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "unit_vacancy_info"

    def __str__(self):
        return f"{self.unit} vacancy info"


class UnitNotificationSubscription(models.Model):
    """User subscription to be notified when a vacancy matches their search filters."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="vacancy_notification_subscriptions",
    )
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    search_filters = models.JSONField(
        default=dict,
        help_text="Saved filters: unit_type, location, min_rent, max_rent (optional keys).",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "unit_notification_subscriptions"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.email} subscription"


class TenantUnitAlert(models.Model):
    """Tenant's saved search alert: get notified when units match criteria."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tenant_unit_alerts",
    )
    unit_type = models.CharField(max_length=32, blank=True)
    min_rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Minimum monthly rent (optional).",
    )
    max_rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Maximum monthly rent (optional).",
    )
    location = models.CharField(max_length=255, blank=True)
    property_name = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenant_alerts"
        ordering = ["-created_at"]

    def __str__(self):
        return f"Alert for {self.user.email} ({self.unit_type or 'any'} @ {self.location or 'any'})"


class TenantVacancyPreference(models.Model):
    """Tenant's search preferences for finding a unit (unit type, location)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="vacancy_preference",
    )
    is_looking = models.BooleanField(default=False)
    preferred_unit_type = models.CharField(
        max_length=32,
        blank=True,
        choices=Unit.UnitType.choices,
    )
    preferred_location = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenant_vacancy_preferences"

    def __str__(self):
        return f"{self.user.email} preference"


class UnitApplication(models.Model):
    """Queue: tenant applies for a unit; property owner/manager approve or decline in order."""
    class Status(models.TextChoices):
        WAITING = "waiting", "Waiting"
        APPROVED = "approved", "Approved"
        DECLINED = "declined", "Declined"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    applicant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="unit_applications",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="applications",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.WAITING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "unit_applications"
        ordering = ["created_at"]
        unique_together = [["unit", "applicant"]]

    def __str__(self):
        return f"{self.applicant.email} -> {self.unit} ({self.status})"


class VacateNotice(models.Model):
    """Notice submitted by tenant; triggers vacancy listing. notice_due_date = move_out_date; notice_given_date from created_at."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="vacate_notices",
    )
    move_out_date = models.DateField(help_text="Notice due date; when reached and not cancelled, unit is marked vacant.")
    reason = models.CharField(max_length=255, blank=True)
    notice_message = models.TextField(blank=True)
    notice_cancelled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "vacate_notices"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.lease.unit} - {self.move_out_date}"


class VacancyListing(models.Model):
    """Listing created when tenant submits vacate notice."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="vacancy_listings",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="vacancy_listings",
    )
    vacate_notice = models.OneToOneField(
        VacateNotice,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vacancy_listing",
    )
    available_from = models.DateField()
    is_filled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "vacancy_listings"
        ordering = ["available_from"]

    def __str__(self):
        return f"{self.unit} - available {self.available_from}"


class TenantScore(models.Model):
    """Platform-native tenant score built from payments, complaints, marketplace reliability, and landlord ratings."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="platform_tenant_score",
    )
    overall_score = models.PositiveSmallIntegerField(default=500, help_text="Range 300-900")
    payment_consistency = models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")
    maintenance_behavior = models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")
    service_reliability = models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")
    landlord_rating = models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")
    dispute_history = models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")
    explainability = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenant_scores"

    def __str__(self):
        return f"{self.tenant.email} score={self.overall_score}"


class VacancyPrediction(models.Model):
    """Prediction artifact for expected upcoming vacancy for an occupied unit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.OneToOneField(
        Unit,
        on_delete=models.CASCADE,
        related_name="vacancy_prediction",
    )
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="vacancy_predictions",
    )
    predicted_vacancy_date = models.DateField()
    confidence = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, help_text="0.00-1.00")
    risk_level = models.CharField(max_length=16, default="low")
    factors = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "vacancy_predictions"

    def __str__(self):
        return f"{self.unit} prediction={self.predicted_vacancy_date} ({self.confidence})"


class UnitTenantRanking(models.Model):
    """Dynamic ranking queue for tenants interested in a specific unit."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="tenant_rankings",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="unit_rankings",
    )
    score = models.DecimalField(max_digits=8, decimal_places=4)
    rank = models.PositiveIntegerField()
    reason_codes = models.JSONField(default=list, blank=True)
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "unit_tenant_rankings"
        ordering = ["rank", "-score", "generated_at"]
        unique_together = [["unit", "tenant", "generated_at"]]

    def __str__(self):
        return f"{self.unit} -> {self.tenant.email} rank={self.rank}"


class UnitAllocationReservation(models.Model):
    """Timed hold for a ranked tenant during smart allocation."""

    class Status(models.TextChoices):
        ACTIVE = "active", "Active"
        EXPIRED = "expired", "Expired"
        ACCEPTED = "accepted", "Accepted"
        DECLINED = "declined", "Declined"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="allocation_reservations",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="allocation_reservations",
    )
    ranking = models.ForeignKey(
        UnitTenantRanking,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reservations",
    )
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    window_start = models.DateTimeField()
    window_end = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "unit_allocation_reservations"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.unit} reserved for {self.tenant.email} ({self.status})"
