import uuid
from django.db import models
from django.conf import settings
from properties.models import Unit


class TenantProfile(models.Model):
    """Profile linking a user (as tenant) to lease/rental context."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="tenant_profile",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "tenant_profiles"

    def __str__(self):
        return str(self.user.email)


class Lease(models.Model):
    """Lease linking a tenant to a unit with rent and dates."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="leases",
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="leases",
    )
    monthly_rent = models.DecimalField(max_digits=12, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    deposit_paid = models.BooleanField(default=False)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "leases"
        ordering = ["-start_date"]

    def __str__(self):
        return f"{self.unit} - {self.tenant.email}"


class LeaseHistory(models.Model):
    """Historical record when a tenant's lease ends (e.g. after notice period). Preserves occupancy data."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="lease_history",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="lease_history",
    )
    lease_start_date = models.DateField()
    lease_end_date = models.DateField()
    notice_date = models.DateField(null=True, blank=True, help_text="When vacate notice was given (created_at of notice).")
    move_out_date = models.DateField(help_text="When tenant moved out / notice period ended.")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "lease_history"
        ordering = ["-move_out_date"]
        verbose_name_plural = "Lease history"

    def __str__(self):
        return f"{self.unit} (tenant {self.tenant.email}) ended {self.move_out_date}"
