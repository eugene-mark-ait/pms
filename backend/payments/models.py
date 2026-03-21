import uuid
from decimal import Decimal

from django.conf import settings
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


class MpesaStkPayment(models.Model):
    """
    One STK Push attempt for rent. Status becomes success/failed only after Daraja callback.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="mpesa_stk_payments",
    )
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="mpesa_stk_payments",
    )
    months_paid_for = models.PositiveIntegerField()
    phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    deposit_to_add = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    checkout_request_id = models.CharField(max_length=80, unique=True, db_index=True)
    merchant_request_id = models.CharField(max_length=80, blank=True)
    mpesa_receipt_number = models.CharField(max_length=80, blank=True)
    result_code = models.IntegerField(null=True, blank=True)
    result_desc = models.TextField(blank=True)
    # Set when Daraja STK callback is received (success or failure).
    completed_at = models.DateTimeField(null=True, blank=True, db_index=True)
    payment = models.OneToOneField(
        "Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="mpesa_stk",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "mpesa_stk_payments"
        ordering = ["-created_at"]

    def __str__(self):
        return f"STK {self.checkout_request_id[:12]}… {self.status}"


class RentCollectionTransaction(models.Model):
    """
    IntaSend-based rent collection: full amount → platform; 3% commission; 97% to owner per property payout settings.
    """

    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        COLLECTED = "collected", "Collected"
        FAILED = "failed", "Failed"

    class PayoutStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        PROCESSING = "processing", "Processing"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        MANUAL = "manual", "Manual review"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    lease = models.ForeignKey(
        Lease,
        on_delete=models.CASCADE,
        related_name="rent_collection_transactions",
    )
    property = models.ForeignKey(
        "properties.Property",
        on_delete=models.CASCADE,
        related_name="rent_collection_transactions",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="rent_collection_transactions",
    )
    tenant_phone = models.CharField(max_length=20)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    platform_cut = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    owner_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    platform_commission_rate = models.DecimalField(
        max_digits=5,
        decimal_places=4,
        default=Decimal("0.0300"),
        help_text="Configurable later; default 3%.",
    )
    months_paid_for = models.PositiveIntegerField()
    deposit_to_add = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    period_start = models.DateField()
    period_end = models.DateField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_index=True,
    )
    payout_status = models.CharField(
        max_length=20,
        choices=PayoutStatus.choices,
        default=PayoutStatus.PENDING,
    )
    intasend_invoice_id = models.CharField(max_length=120, blank=True, db_index=True)
    intasend_api_ref = models.CharField(max_length=120, blank=True)
    intasend_reference = models.CharField(max_length=255, blank=True)
    payout_tracking_id = models.CharField(max_length=120, blank=True)
    payout_error = models.TextField(blank=True)
    payment = models.OneToOneField(
        "Payment",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="rent_collection",
    )
    failure_reason = models.TextField(blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "rent_collection_transactions"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"RentCollection {self.id} {self.status}"


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
