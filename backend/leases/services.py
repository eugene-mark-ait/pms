"""
Rent tracking: compute next due date and balance from payments.

Outstanding balance = (rent_due + unpaid_deposit + unpaid_charges) - payments_made.
All values use safe fallbacks for null/missing data.
"""
from datetime import date
from decimal import Decimal
from django.db.models import Max, Sum

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


def _safe_decimal(value, default: Decimal | None = None) -> Decimal:
    """Coerce value to Decimal; return default for None/invalid."""
    if value is None:
        return default or Decimal("0")
    try:
        return Decimal(str(value))
    except Exception:
        return default or Decimal("0")


def get_outstanding_balance(lease: Lease, as_of: date | None = None) -> Decimal:
    """
    Outstanding balance = (rent_due + deposit_if_unpaid) - payments_made.

    - Rent due: months from next_rent_due up to as_of * monthly_rent.
    - Unpaid deposit: deposit_amount if deposit_paid is False, else 0.
    - Payments made: sum of completed payment amounts for this lease.
    Uses fallbacks for null/missing values so all tenants see a consistent result.
    """
    as_of = as_of or date.today()
    monthly_rent = _safe_decimal(getattr(lease, "monthly_rent", None), Decimal("0"))
    deposit_amount = _safe_decimal(getattr(lease, "deposit_amount", None), Decimal("0"))
    deposit_paid = getattr(lease, "deposit_paid", True)

    # Rent due from next_due through as_of (inclusive months)
    next_due = get_next_rent_due_date(lease)
    if as_of < next_due:
        rent_due = Decimal("0")
    else:
        months = 0
        d = next_due
        while d <= as_of:
            months += 1
            if d.month == 12:
                d = date(d.year + 1, 1, d.day)
            else:
                d = date(d.year, d.month + 1, d.day)
        rent_due = monthly_rent * months

    # Unpaid deposit
    deposit_if_unpaid = Decimal("0") if deposit_paid else deposit_amount

    # Total owed (rent + deposit if unpaid)
    total_owed = rent_due + deposit_if_unpaid

    # Sum of completed payments for this lease
    payments_sum = (
        Payment.objects.filter(
            lease=lease,
            payment_status=Payment.PaymentStatus.COMPLETED,
        )
        .aggregate(Sum("amount"))
        .get("amount__sum")
    )
    payments_made = _safe_decimal(payments_sum, Decimal("0"))

    balance = total_owed - payments_made
    return max(Decimal("0"), balance)


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
