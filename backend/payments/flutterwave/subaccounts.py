"""Landlord payout subaccounts (M-Pesa KE): one Flutterwave subaccount per normalized payment phone."""
from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from django.db import transaction

from properties.models import Property

from ..kenya_phone import normalize_kenya_payment_phone, validate_kenya_payment_phone
from .http_client import request_json

if TYPE_CHECKING:
    from ..models import FlutterwaveSubaccount

logger = logging.getLogger(__name__)

# Platform keeps 1% commission; landlord subaccount receives the remainder per Flutterwave split rules.
PLATFORM_SPLIT_PERCENT = 0.01


def _create_remote_subaccount(*, phone: str, business_name: str) -> str:
    payload = {
        "account_bank": "MPS",
        "account_number": phone,
        "business_name": business_name[:100],
        "business_mobile": phone,
        "country": "KE",
        "split_type": "percentage",
        "split_value": PLATFORM_SPLIT_PERCENT,
    }
    res = request_json("POST", "/subaccounts", json_body=payload)
    data = res.get("data") or {}
    sid = data.get("subaccount_id") or data.get("sub_account_id")
    if not sid:
        logger.error("Unexpected subaccount response: %s", res)
        raise RuntimeError("Flutterwave did not return a subaccount id.")
    return str(sid)


def ensure_subaccount_for_property(property_obj: Property) -> "FlutterwaveSubaccount":
    """
    Ensure a FlutterwaveSubaccount row exists for the property's payment phone and is not stale.
    Creates the remote subaccount once per normalized phone; reactivates a stale row when the phone is reused.
    """
    from ..models import FlutterwaveSubaccount

    phone = validate_kenya_payment_phone(property_obj.payment_phone)
    label = (property_obj.name or "Property")[:100]

    with transaction.atomic():
        row = (
            FlutterwaveSubaccount.objects.select_for_update()
            .filter(phone_normalized=phone)
            .first()
        )
        if row and row.subaccount_id:
            if row.is_stale:
                row.is_stale = False
                row.save(update_fields=["is_stale", "updated_at"])
            return row

        sub_id = _create_remote_subaccount(phone=phone, business_name=label)
        row, _ = FlutterwaveSubaccount.objects.update_or_create(
            phone_normalized=phone,
            defaults={
                "subaccount_id": sub_id,
                "is_stale": False,
            },
        )
        return row


def mark_stale_if_phone_unused(old_phone_raw: str | None, *, exclude_property_id) -> None:
    """After a property changes payment phone, mark the old subaccount mapping stale if no property uses that number."""
    from ..models import FlutterwaveSubaccount

    old = normalize_kenya_payment_phone(old_phone_raw)
    if not old:
        return
    for p in Property.objects.exclude(id=exclude_property_id).exclude(payment_phone=""):
        if normalize_kenya_payment_phone(p.payment_phone) == old:
            return
    FlutterwaveSubaccount.objects.filter(phone_normalized=old).update(is_stale=True)


def refresh_subaccount_after_property_save(property_obj: Property, old_phone: str | None = None) -> None:
    """Call after create/update when payment_phone is set."""
    if old_phone is not None and (property_obj.payment_phone or "").strip() != (old_phone or "").strip():
        mark_stale_if_phone_unused(old_phone_raw=old_phone, exclude_property_id=property_obj.id)
    ensure_subaccount_for_property(property_obj)
