import uuid
from django.db import models
from leases.models import Lease


class Payment(models.Model):
    """Payment linked to a lease; supports multi-month payments."""
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        REFUNDED = "refunded", "Refunded"

    class PaymentMethod(models.TextChoices):
        MPESA = "mpesa", "M-Pesa"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="payments",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    months_paid_for = models.PositiveIntegerField(default=1)
    period_start = models.DateField(null=True, blank=True)
    period_end = models.DateField(null=True, blank=True)
    payment_date = models.DateField()
    payment_method = models.CharField(
        max_length=50,
        choices=PaymentMethod.choices,
        default=PaymentMethod.MPESA,
    )
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )
    transaction_reference = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        ordering = ["-payment_date"]

    def __str__(self):
        return f"{self.lease} - {self.amount} ({self.payment_date})"


class Transaction(models.Model):
    """Generic transaction record for audit trail."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.ForeignKey(
        Payment,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="transactions",
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    description = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "transactions"

    def __str__(self):
        return f"{self.amount} - {self.description}"


class PaymentReceipt(models.Model):
    """Receipt generated for a payment."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    payment = models.OneToOneField(
        Payment,
        on_delete=models.CASCADE,
        related_name="receipt",
    )
    receipt_number = models.CharField(max_length=50, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payment_receipts"

    def __str__(self):
        return self.receipt_number


class CreditScoreRecord(models.Model):
    """Tracks tenant payment history for reliability score."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="credit_score_records",
    )
    score = models.PositiveSmallIntegerField(null=True, blank=True)
    on_time_payments = models.PositiveIntegerField(default=0)
    late_payments = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "credit_score_records"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.lease.tenant.email} - {self.score}"
