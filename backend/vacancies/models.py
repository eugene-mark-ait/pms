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
