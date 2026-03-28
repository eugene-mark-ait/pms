"""
Shared rent payment calculation and lease completion (used after M-PESA callback).
"""
from __future__ import annotations

from calendar import monthrange
from datetime import date
from decimal import Decimal

from django.shortcuts import get_object_or_404

from leases.models import Lease
from leases.services import get_last_payment_end, get_next_rent_due_date, get_payment_status
from notifications.models import Notification

from .models import Payment


def compute_pay_rent_totals(lease: Lease, months: int) -> dict:
    """
    On success returns keys: amount, deposit_to_add, period_start, period_end.
    On failure returns {"error": "message"}.
    """
    if months < 1 or months > 3:
        return {"error": "Months must be 1, 2, or 3."}

    if get_payment_status(lease) == "paid":
        return {"error": "Current period is already paid."}

    next_due = get_next_rent_due_date(lease)
    end_month = next_due.month + months - 1
    end_year = next_due.year
    while end_month > 12:
        end_month -= 12
        end_year += 1
    _, last_day = monthrange(end_year, end_month)
    period_start = next_due
    period_end = date(end_year, end_month, last_day)

    amount = lease.monthly_rent * months
    deposit_to_add = Decimal("0")
    if not lease.deposit_paid and lease.deposit_amount and lease.deposit_amount > 0:
        last_end = get_last_payment_end(lease)
        if last_end is None:
            deposit_to_add = lease.deposit_amount
    amount += deposit_to_add

    if amount <= 0:
        return {"error": "Payment amount must be greater than zero."}

    return {
        "amount": amount,
        "deposit_to_add": deposit_to_add,
        "period_start": period_start,
        "period_end": period_end,
    }


def create_completed_rent_payment(
    *,
    lease: Lease,
    months: int,
    amount: Decimal,
    deposit_to_add: Decimal,
    period_start: date,
    period_end: date,
    transaction_reference: str = "",
    payment_method: str = Payment.PaymentMethod.MPESA,
) -> Payment:
    """Persist completed Payment and related lease updates (mirrors former PayRentView)."""
    today = date.today()
    payment = Payment.objects.create(
        lease=lease,
        amount=amount,
        months_paid_for=months,
        period_start=period_start,
        period_end=period_end,
        payment_date=today,
        payment_method=payment_method,
        payment_status=Payment.PaymentStatus.COMPLETED,
        transaction_reference=transaction_reference[:255] if transaction_reference else "",
    )

    if deposit_to_add > 0:
        lease.deposit_paid = True
        lease.save(update_fields=["deposit_paid", "updated_at"])

    Notification.objects.create(
        user=lease.unit.property.property_owner,
        notification_type=Notification.NotificationType.PAYMENT_RECEIVED,
        title="Rent payment received",
        body=f"Tenant paid {amount} for {lease.unit.unit_number} ({months} month(s)) via rent payment.",
    )
    return payment


def get_lease_for_tenant(lease_id, user) -> Lease:
    return get_object_or_404(
        Lease,
        id=lease_id,
        tenant=user,
        is_active=True,
    )
