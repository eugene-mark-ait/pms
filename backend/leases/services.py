"""
Rent tracking: compute next due date and balance from payments.
"""
from datetime import date
from decimal import Decimal
from django.db.models import Max

from .models import Lease
from payments.models import Payment


def get_last_payment_end(lease: Lease) -> date | None:
    """Return the period_end of the most recent completed payment, or None."""
    last = (
        Payment.objects.filter(
            lease=lease,
            payment_status=Payment.PaymentStatus.COMPLETED,
        )
        .aggregate(Max("period_end"))
        .get("period_end__max")
    )
    return last


def get_next_rent_due_date(lease: Lease) -> date:
    """Next rent due date: day after last period_end, or lease start_date."""
    last_end = get_last_payment_end(lease)
    if last_end:
        # next due is first day of next period
        if last_end.month == 12:
            return date(last_end.year + 1, 1, lease.start_date.day)
        return date(last_end.year, last_end.month + 1, lease.start_date.day)
    return lease.start_date


def get_outstanding_balance(lease: Lease, as_of: date | None = None) -> Decimal:
    """
    Outstanding balance = rent due from lease start (or last paid period)
    up to as_of minus completed payments. Simplified: months unpaid * monthly_rent.
    """
    as_of = as_of or date.today()
    next_due = get_next_rent_due_date(lease)
    if as_of < next_due:
        return Decimal("0")
    # Count months from next_due to as_of (inclusive of month of next_due)
    months = 0
    d = next_due
    while d <= as_of:
        months += 1
        if d.month == 12:
            d = date(d.year + 1, 1, d.day)
        else:
            d = date(d.year, d.month + 1, d.day)
    return lease.monthly_rent * months


def get_payment_status(lease: Lease) -> str:
    """Return 'paid', 'due', or 'overdue'. Never 'paid' until at least one payment has been made."""
    next_due = get_next_rent_due_date(lease)
    today = date.today()
    last_end = get_last_payment_end(lease)
    # New lease with no payments: never show as "paid" even if start_date is in the future
    if last_end is None:
        if next_due > today:
            return "due"  # rent not yet due, but no payment made
        if next_due == today:
            return "due"
        return "overdue"
    if next_due > today:
        return "paid"
    if next_due == today:
        return "due"
    return "overdue"
