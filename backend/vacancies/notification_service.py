"""
Vacancy notification service: notifies subscribers when a unit becomes available
or matches their saved search filters.

Integration points (to be implemented):
- Email: send via SendGrid, AWS SES, or Django email backend.
- SMS: send via Twilio, Africa's Talking, or similar provider.
"""
import logging
from decimal import Decimal
from django.db.models import Q
from properties.models import Unit
from .models import UnitNotificationSubscription

logger = logging.getLogger(__name__)


def _filters_match_unit(subscription_filters: dict, unit: Unit) -> bool:
    """Return True if the unit matches the subscription's search_filters."""
    if not subscription_filters:
        return True
    filters = subscription_filters or {}
    if filters.get("unit_type") and unit.unit_type != filters["unit_type"]:
        return False
    location = (filters.get("location") or "").strip()
    if location:
        loc_lower = location.lower()
        prop = unit.property
        if not (
            (prop.location and loc_lower in prop.location.lower())
            or (prop.address and loc_lower in prop.address.lower())
        ):
            return False
    try:
        min_rent = filters.get("min_rent")
        if min_rent is not None and min_rent != "":
            min_val = Decimal(str(min_rent))
            if unit.monthly_rent < min_val:
                return False
    except (ValueError, TypeError):
        pass
    try:
        max_rent = filters.get("max_rent")
        if max_rent is not None and max_rent != "":
            max_val = Decimal(str(max_rent))
            if unit.monthly_rent > max_val:
                return False
    except (ValueError, TypeError):
        pass
    return True


def vacancy_count_for_filters(filters_dict: dict) -> int:
    """Return count of discoverable units matching the given search_filters (same logic as vacancy search)."""
    if not isinstance(filters_dict, dict):
        return 0
    qs = Unit.objects.filter(
        is_vacant=True,
        is_reserved=False,
        property__is_closed=False,
    )
    unit_type = (filters_dict.get("unit_type") or "").strip()
    location = (filters_dict.get("location") or "").strip()
    min_rent = filters_dict.get("min_rent")
    max_rent = filters_dict.get("max_rent")
    if unit_type:
        qs = qs.filter(unit_type=unit_type)
    if location:
        qs = qs.filter(
            Q(property__location__icontains=location) | Q(property__address__icontains=location)
        )
    if min_rent is not None and str(min_rent).strip() != "":
        try:
            qs = qs.filter(monthly_rent__gte=float(min_rent))
        except (ValueError, TypeError):
            pass
    if max_rent is not None and str(max_rent).strip() != "":
        try:
            qs = qs.filter(monthly_rent__lte=float(max_rent))
        except (ValueError, TypeError):
            pass
    return qs.count()


def get_matching_subscriptions(unit: Unit) -> list:
    """
    Return list of UnitNotificationSubscription whose search_filters match this unit.
    Used both for counting (e.g. "Y users waiting") and for sending notifications.
    """
    # We cannot efficiently filter by JSON in DB in a generic way across DBs,
    # so we fetch subscriptions and filter in Python. For large scale, consider
    # storing filter keys in separate columns or a dedicated search table.
    qs = UnitNotificationSubscription.objects.all()
    matching = []
    for sub in qs:
        if _filters_match_unit(sub.search_filters, unit):
            matching.append(sub)
    return matching


def _subscription_matches_search_params(sub_filters: dict, unit_type: str, location: str, min_rent_val, max_rent_val) -> bool:
    """Return True if a unit with the given params would match this subscription's filters."""
    if not sub_filters:
        return True
    if unit_type and sub_filters.get("unit_type") and sub_filters["unit_type"] != unit_type:
        return False
    if location:
        loc_lower = location.strip().lower()
        sub_loc = (sub_filters.get("location") or "").strip().lower()
        if sub_loc and loc_lower not in sub_loc and sub_loc not in loc_lower:
            return False
    if min_rent_val is not None:
        sub_min = sub_filters.get("min_rent")
        if sub_min is not None and sub_min != "":
            try:
                if Decimal(str(sub_min)) > (max_rent_val or Decimal("999999999")):
                    return False
            except (ValueError, TypeError):
                pass
    if max_rent_val is not None:
        sub_max = sub_filters.get("max_rent")
        if sub_max is not None and sub_max != "":
            try:
                if Decimal(str(sub_max)) < (min_rent_val or Decimal("0")):
                    return False
            except (ValueError, TypeError):
                pass
    return True


def count_subscriptions_matching_filters(unit_type: str = "", location: str = "", min_rent: str = "", max_rent: str = "") -> int:
    """
    Count subscriptions whose search_filters match the given search params (same as Find Units search).
    Used to display "Y users waiting for notification" on Find Units.
    """
    unit_type = (unit_type or "").strip()
    location = (location or "").strip()
    min_rent = (min_rent or "").strip()
    max_rent = (max_rent or "").strip()
    min_rent_val = None
    max_rent_val = None
    if min_rent:
        try:
            min_rent_val = Decimal(min_rent)
        except ValueError:
            pass
    if max_rent:
        try:
            max_rent_val = Decimal(max_rent)
        except ValueError:
            pass
    qs = UnitNotificationSubscription.objects.all()
    count = 0
    for sub in qs:
        if _subscription_matches_search_params(sub.search_filters or {}, unit_type, location, min_rent_val, max_rent_val):
            count += 1
    return count


def _send_notification_stub(subscription: UnitNotificationSubscription, unit: Unit, available_from: str = None):
    """
    Stub: where email/SMS will be sent.
    TODO: Integrate with email provider (SendGrid, SES, etc.).
    TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.).
    """
    # Log for now; replace with actual send.
    logger.info(
        "Vacancy notification (stub): would notify %s (phone: %s) for unit %s (%s), available_from=%s",
        subscription.email,
        subscription.phone or "(none)",
        unit.id,
        unit.unit_number,
        available_from,
    )


def notify_subscribers(unit: Unit, available_from=None):
    """
    Find all subscriptions whose filters match this unit and trigger notifications.
    Call this when:
    - Unit status changes to VACANT
    - Tenant submits a move-out notice (unit will become available)
    - A new unit is created that matches subscriber filters

    available_from: optional date (or ISO string) when the unit becomes available.
    """
    if available_from is not None and hasattr(available_from, "isoformat"):
        available_from = available_from.isoformat()
    matching = get_matching_subscriptions(unit)
    for subscription in matching:
        _send_notification_stub(subscription, unit, available_from)
    if matching:
        logger.info("Notified %d subscriber(s) for unit %s", len(matching), unit.id)
