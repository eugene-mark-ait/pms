"""Rent payment orchestration: initiate Flutterwave M-Pesa charge and complete after verify/webhook."""
from __future__ import annotations

import logging
import uuid
from decimal import Decimal

from django.db import transaction
from django.utils import timezone

from ..daraja import stk_amount_kes
from ..kenya_phone import normalize_kenya_payment_phone
from ..models import FlutterwaveRentCharge, FlutterwaveSubaccount, Payment
from ..rent_service import compute_pay_rent_totals, create_completed_rent_payment, get_lease_for_tenant
from .charges import initiate_mpesa_charge, verify_charge_by_id
from .customers import ensure_flutterwave_customer
from .oauth import flutterwave_configured
from .subaccounts import ensure_subaccount_for_property

logger = logging.getLogger(__name__)


def initiate_rent_payment_flutterwave(
    *,
    user,
    lease_id,
    months: int,
    payer_phone: str,
    amount: Decimal,
) -> dict:
    """Validate totals, ensure subaccount + customer, create Flutterwave M-Pesa charge. Returns API response dict for the client."""
    if not flutterwave_configured():
        raise RuntimeError("Flutterwave is not configured.")

    lease = get_lease_for_tenant(lease_id, user)
    totals = compute_pay_rent_totals(lease, months)
    if "error" in totals:
        raise ValueError(totals["error"])
    if totals["amount"] != amount:
        raise ValueError("Amount does not match expected rent total.")

    prop = lease.unit.property
    raw_pp = (prop.payment_phone or "").strip()
    landlord_phone = normalize_kenya_payment_phone(raw_pp)
    if not landlord_phone:
        raise ValueError(
            "This property does not have a valid payment phone. The owner must set 2547XXXXXXXX on the property."
        )

    ensure_flutterwave_customer(user)
    cust_id = (getattr(user, "flutterwave_customer_id", None) or "").strip() or None

    ensure_subaccount_for_property(prop)
    sub = FlutterwaveSubaccount.objects.filter(phone_normalized=landlord_phone, is_stale=False).first()
    if not sub:
        raise ValueError("Could not resolve Flutterwave subaccount for this property.")

    kes = stk_amount_kes(amount)
    if kes < 1:
        raise ValueError("Amount must be at least 1 KES.")

    tx_ref = f"rent-{uuid.uuid4().hex}"
    fullname = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email.split("@")[0]

    res = initiate_mpesa_charge(
        amount_kes=kes,
        payer_phone=payer_phone,
        email=user.email,
        fullname=fullname,
        landlord_subaccount_id=sub.subaccount_id,
        tx_ref=tx_ref,
        flutterwave_customer_id=cust_id,
    )
    data = res.get("data") or {}
    charge_id = data.get("id")
    flw_ref = str(data.get("flw_ref") or data.get("flw_ref_id") or "")

    frc = FlutterwaveRentCharge.objects.create(
        user=user,
        lease=lease,
        months_paid_for=months,
        phone=payer_phone,
        amount=amount,
        deposit_to_add=totals["deposit_to_add"],
        period_start=totals["period_start"],
        period_end=totals["period_end"],
        tx_ref=tx_ref,
        flw_charge_id=int(charge_id) if charge_id is not None else None,
        flw_ref=flw_ref[:80],
        status=FlutterwaveRentCharge.Status.PENDING,
    )

    return {
        "provider": "flutterwave",
        "id": str(frc.id),
        "tx_ref": tx_ref,
        "flw_ref": flw_ref,
        "status": "pending",
        "message": data.get("processor_response") or res.get("message") or "Charge initiated. Approve on your phone.",
    }


def sync_flutterwave_rent_charge_from_api(charge: FlutterwaveRentCharge) -> FlutterwaveRentCharge:
    """If still pending, verify transaction on Flutterwave and complete locally when successful."""
    if charge.status != FlutterwaveRentCharge.Status.PENDING or not charge.flw_charge_id:
        return charge
    try:
        vr = verify_charge_by_id(charge.flw_charge_id)
    except Exception:
        logger.exception("Flutterwave verify failed for charge %s", charge.id)
        return charge
    return apply_verify_response(charge, vr)


def apply_verify_response(charge: FlutterwaveRentCharge, verify_json: dict) -> FlutterwaveRentCharge:
    """Map verify (or webhook-shaped) payload to success/failure."""
    data = verify_json.get("data")
    if not isinstance(data, dict):
        data = {}
    st = (data.get("status") or "").lower()
    if st == "successful":
        return _mark_success(charge, data)
    if st in ("failed", "error", "cancelled"):
        return _mark_failed(charge, data.get("processor_response") or data.get("message") or st)
    return charge


def _mark_success(charge: FlutterwaveRentCharge, data: dict) -> FlutterwaveRentCharge:
    with transaction.atomic():
        locked = FlutterwaveRentCharge.objects.select_for_update().filter(pk=charge.pk).first()
        if not locked:
            return charge
        if locked.status == FlutterwaveRentCharge.Status.SUCCESS and locked.payment_id:
            return locked
        ref = str(data.get("flw_ref") or data.get("flw_ref_id") or locked.flw_ref or locked.tx_ref)[:255]
        now = timezone.now()
        pay = create_completed_rent_payment(
            lease=locked.lease,
            months=locked.months_paid_for,
            amount=locked.amount,
            deposit_to_add=locked.deposit_to_add,
            period_start=locked.period_start,
            period_end=locked.period_end,
            transaction_reference=ref,
            payment_method=Payment.PaymentMethod.FLUTTERWAVE_MPESA,
        )
        locked.payment = pay
        locked.status = FlutterwaveRentCharge.Status.SUCCESS
        locked.flw_ref = str(data.get("flw_ref") or locked.flw_ref)[:80]
        locked.completed_at = now
        locked.save(
            update_fields=[
                "payment",
                "status",
                "flw_ref",
                "completed_at",
                "updated_at",
            ]
        )
        return locked


def _mark_failed(charge: FlutterwaveRentCharge, message: str) -> FlutterwaveRentCharge:
    if charge.status == FlutterwaveRentCharge.Status.FAILED:
        return charge
    charge.status = FlutterwaveRentCharge.Status.FAILED
    charge.result_message = (message or "")[:2000]
    charge.completed_at = timezone.now()
    charge.save(update_fields=["status", "result_message", "completed_at", "updated_at"])
    _notify_tenant_payment_failed(charge)
    return charge


def _notify_tenant_payment_failed(charge: FlutterwaveRentCharge) -> None:
    try:
        from notifications.models import Notification

        Notification.objects.create(
            user=charge.user,
            notification_type=Notification.NotificationType.GENERAL,
            title="Rent payment failed",
            body="Your M-Pesa payment could not be completed. You can try again from Pay Rent.",
        )
    except Exception:
        logger.exception("Could not notify tenant about failed Flutterwave charge %s", charge.id)


def handle_webhook_payload(payload: dict) -> None:
    """Process verified webhook JSON (charge.completed / charge.failed)."""
    ev = (payload.get("type") or payload.get("event") or "").lower()
    data = payload.get("data") or {}
    if not isinstance(data, dict):
        return

    tx_ref = data.get("tx_ref") or data.get("txRef") or data.get("reference")
    if not tx_ref:
        return

    charge = FlutterwaveRentCharge.objects.filter(tx_ref=str(tx_ref)[:120]).first()
    if not charge:
        logger.warning("Flutterwave webhook: unknown tx_ref=%s", tx_ref)
        return

    st = (data.get("status") or "").lower()
    if st == "successful":
        apply_verify_response(charge, {"status": "success", "data": data})
        return
    if "charge.failed" in ev or st in ("failed", "error"):
        _mark_failed(charge, data.get("processor_response") or str(data.get("status")))
