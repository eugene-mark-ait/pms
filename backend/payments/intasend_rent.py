"""
IntaSend rent collection: STK → platform wallet, 3% / 97% split, owner disbursement.

Collection webhook states (IntaSend): PENDING, PROCESSING, COMPLETE, FAILED
https://developers.intasend.com/docs/payment-collection-events
"""
from __future__ import annotations

import logging
import re
from decimal import Decimal
from typing import Any

from django.conf import settings
from django.db import transaction
from django.utils import timezone

from properties.models import PropertyPayoutSettings

from .intasend_service import IntaSendAPIError, extract_invoice_id_safe
from .models import RentCollectionTransaction
from .rent_service import create_completed_rent_payment

logger = logging.getLogger(__name__)

MPESA_E164_RE = re.compile(r"^254[17]\d{8}$")


def commission_split(amount: Decimal, rate: Decimal) -> tuple[Decimal, Decimal]:
    """platform_cut + owner_amount == amount (after rounding)."""
    platform_cut = (amount * rate).quantize(Decimal("0.01"))
    owner_amount = (amount - platform_cut).quantize(Decimal("0.01"))
    return platform_cut, owner_amount


def default_commission_rate() -> Decimal:
    r = getattr(settings, "PLATFORM_COMMISSION_RATE", Decimal("0.03"))
    return Decimal(str(r)).quantize(Decimal("0.0001"))


def phone_to_intasend_int(phone: str) -> int:
    p = phone.strip().replace("+", "").replace(" ", "").replace("-", "")
    if p.startswith("0") and len(p) == 10:
        p = "254" + p[1:]
    if len(p) == 9 and p.startswith("7"):
        p = "254" + p
    if not MPESA_E164_RE.match(p):
        raise ValueError("Invalid M-PESA phone for IntaSend.")
    return int(p)


def extract_invoice_id(resp: dict[str, Any] | None) -> str:
    """Invoice id from STK init or status payload."""
    if not isinstance(resp, dict):
        return ""
    return extract_invoice_id_safe(resp)


def _normalize_state(raw: Any) -> str:
    if raw is None:
        return ""
    return str(raw).strip().upper()


def extract_state_from_payload(payload: dict[str, Any] | None) -> str:
    """Resolve state from collection webhook or collect.status response."""
    if not isinstance(payload, dict):
        return ""
    st = payload.get("state") or payload.get("status") or payload.get("invoice_state")
    if st is None and isinstance(payload.get("invoice"), dict):
        inv = payload["invoice"]
        st = inv.get("state") or inv.get("status")
    return _normalize_state(st)


def _state_complete_normalized(state: str) -> bool:
    # Official: COMPLETE — https://developers.intasend.com/docs/payment-collection-events
    if state in ("COMPLETE", "COMPLETED"):
        return True
    # Defensive aliases seen in some gateways
    if state in ("SUCCESS", "PAID", "TS100"):
        return True
    return False


def _state_failed_normalized(state: str) -> bool:
    if state in ("FAILED", "FAILURE", "CANCELLED", "CANCELED", "REJECTED"):
        return True
    return False


def is_failed_state(payload: dict[str, Any]) -> bool:
    st = extract_state_from_payload(payload)
    return _state_failed_normalized(st)


def _state_complete(payload: dict[str, Any]) -> bool:
    st = extract_state_from_payload(payload)
    return _state_complete_normalized(st)


def extract_failed_reason(payload: dict[str, Any] | None) -> str:
    if not isinstance(payload, dict):
        return ""
    r = payload.get("failed_reason") or payload.get("failedReason")
    if not r and isinstance(payload.get("invoice"), dict):
        r = (payload.get("invoice") or {}).get("failed_reason")
    if r:
        return str(r)[:2000]
    return ""


def mark_collection_failed(tx: RentCollectionTransaction, reason: str = "") -> None:
    RentCollectionTransaction.objects.filter(
        pk=tx.pk,
        status=RentCollectionTransaction.Status.PENDING,
    ).update(
        status=RentCollectionTransaction.Status.FAILED,
        failure_reason=(reason or "Payment failed")[:2000],
        completed_at=timezone.now(),
    )


def parse_intasend_webhook(body: dict[str, Any]) -> dict[str, Any]:
    """
    Normalize webhook payload (https://developers.intasend.com/docs/payment-collection-events).
    Includes ``challenge`` for dashboard validation (compare to INTASEND_WEBHOOK_CHALLENGE).
    """
    invoice_id = (
        body.get("invoice_id")
        or body.get("invoiceId")
        or ((body.get("invoice") or {}).get("id") if isinstance(body.get("invoice"), dict) else None)
    )
    if isinstance(body.get("invoice"), dict) and not invoice_id:
        invoice_id = body["invoice"].get("invoice_id") or body["invoice"].get("id")

    api_ref = body.get("api_ref") or body.get("apiRef")
    if api_ref is None and isinstance(body.get("invoice"), dict):
        api_ref = body["invoice"].get("api_ref")

    complete = _state_complete(body) or (
        isinstance(body.get("invoice"), dict) and _state_complete(body["invoice"])
    )
    failed = (is_failed_state(body) or (
        isinstance(body.get("invoice"), dict) and is_failed_state(body["invoice"])
    )) and not complete

    failed_reason = extract_failed_reason(body)
    if not failed_reason and isinstance(body.get("invoice"), dict):
        failed_reason = extract_failed_reason(body["invoice"])

    mpesa_ref = (
        body.get("mpesa_reference")
        or body.get("provider_reference")
        or body.get("mpesa_receipt")
        or body.get("receipt_number")
    )
    if not mpesa_ref and isinstance(body.get("invoice"), dict):
        inv = body["invoice"]
        mpesa_ref = inv.get("mpesa_reference") or inv.get("provider_reference")

    challenge = body.get("challenge")
    failed_code = body.get("failed_code") or body.get("failedCode")

    return {
        "invoice_id": str(invoice_id).strip() if invoice_id else "",
        "api_ref": str(api_ref).strip() if api_ref else "",
        "complete": complete,
        "failed": failed,
        "failed_reason": str(failed_reason or "")[:2000],
        "failed_code": str(failed_code or "")[:64],
        "mpesa_reference": str(mpesa_ref or "")[:255],
        "challenge": str(challenge) if challenge is not None else "",
    }


def find_rent_transaction_for_intasend(*, invoice_id: str = "", api_ref: str = "") -> RentCollectionTransaction | None:
    qs = RentCollectionTransaction.objects.all()
    if invoice_id:
        t = qs.filter(intasend_invoice_id=invoice_id).first()
        if t:
            return t
    if api_ref:
        t = qs.filter(intasend_api_ref=api_ref).first()
        if t:
            return t
    return None


def poll_intasend_invoice_state(tx: RentCollectionTransaction) -> dict[str, Any] | None:
    """Returns status payload from IntaSend collect.status, or None on transport/SDK failure."""
    from . import intasend_service

    if not tx.intasend_invoice_id:
        return None
    try:
        return intasend_service.collect_status(invoice_id=tx.intasend_invoice_id)
    except IntaSendAPIError:
        logger.warning("IntaSend collect.status API error for tx=%s", tx.id, exc_info=True)
        return None
    except Exception:
        logger.exception("IntaSend collect.status failed tx=%s", tx.id)
        return None


def _invoice_payload_complete(payload: dict[str, Any] | None) -> bool:
    if not isinstance(payload, dict):
        return False
    if _state_complete(payload):
        return True
    inv = payload.get("invoice")
    if isinstance(inv, dict) and _state_complete(inv):
        return True
    return False


def _invoice_payload_failed(payload: dict[str, Any] | None) -> bool:
    if not isinstance(payload, dict):
        return False
    if is_failed_state(payload):
        return True
    inv = payload.get("invoice")
    if isinstance(inv, dict) and is_failed_state(inv):
        return True
    return False


def maybe_finalize_from_poll(tx: RentCollectionTransaction) -> RentCollectionTransaction:
    """If still pending, ask IntaSend for status: finalize on COMPLETE, fail on FAILED."""
    if tx.status != RentCollectionTransaction.Status.PENDING:
        return tx
    if not tx.intasend_invoice_id:
        return tx
    raw = poll_intasend_invoice_state(tx)
    if not raw:
        tx.refresh_from_db()
        return tx

    if _invoice_payload_complete(raw):
        ref = ""
        if isinstance(raw, dict):
            ref = str(raw.get("mpesa_reference") or raw.get("provider_reference") or "")[:255]
        finalize_successful_collection(tx, mpesa_reference=ref)
    elif _invoice_payload_failed(raw):
        reason = extract_failed_reason(raw) or "Payment failed (status from IntaSend)."
        mark_collection_failed(tx, reason=reason)

    tx.refresh_from_db()
    return tx


def finalize_successful_collection(
    tx: RentCollectionTransaction,
    *,
    mpesa_reference: str = "",
) -> None:
    """
    Idempotent: create Payment, mark collected, trigger owner payout.
    """
    with transaction.atomic():
        locked = (
            RentCollectionTransaction.objects.select_for_update()
            .filter(pk=tx.pk)
            .select_related("lease", "property", "user")
            .first()
        )
        if not locked or locked.status != RentCollectionTransaction.Status.PENDING:
            return

        ref = (mpesa_reference or locked.intasend_reference or locked.intasend_invoice_id or str(locked.id))[:255]
        pay = create_completed_rent_payment(
            lease=locked.lease,
            months=locked.months_paid_for,
            amount=locked.amount,
            deposit_to_add=locked.deposit_to_add,
            period_start=locked.period_start,
            period_end=locked.period_end,
            transaction_reference=ref,
        )
        now = timezone.now()
        locked.payment = pay
        locked.status = RentCollectionTransaction.Status.COLLECTED
        locked.intasend_reference = locked.intasend_reference or ref
        locked.completed_at = now
        locked.save(
            update_fields=[
                "payment",
                "status",
                "intasend_reference",
                "completed_at",
                "updated_at",
            ]
        )

    locked2 = RentCollectionTransaction.objects.get(pk=tx.pk)
    trigger_owner_payout(locked2)


def trigger_owner_payout(tx: RentCollectionTransaction) -> None:
    """Send 97% to owner per PropertyPayoutSettings; till/paybill → manual for now."""
    if tx.status != RentCollectionTransaction.Status.COLLECTED:
        return
    if tx.payout_status in (
        RentCollectionTransaction.PayoutStatus.COMPLETED,
        RentCollectionTransaction.PayoutStatus.PROCESSING,
    ):
        return

    prop = tx.property
    try:
        settings_obj = prop.payout_settings
    except PropertyPayoutSettings.DoesNotExist:
        RentCollectionTransaction.objects.filter(pk=tx.pk).update(
            payout_status=RentCollectionTransaction.PayoutStatus.MANUAL,
            payout_error="No payout settings for this property. Configure payout in property settings.",
        )
        return

    min_kes = Decimal(str(getattr(settings, "INTASEND_MIN_PAYOUT_KES", 1)))
    if tx.owner_amount < min_kes:
        RentCollectionTransaction.objects.filter(pk=tx.pk).update(
            payout_status=RentCollectionTransaction.PayoutStatus.MANUAL,
            payout_error=f"Owner share below minimum payout ({min_kes} KES).",
        )
        return

    if settings_obj.method == PropertyPayoutSettings.PayoutMethod.MPESA_PHONE:
        phone = (settings_obj.phone_number or "").strip()
        if not phone:
            RentCollectionTransaction.objects.filter(pk=tx.pk).update(
                payout_status=RentCollectionTransaction.PayoutStatus.MANUAL,
                payout_error="M-Pesa phone not set for owner payout.",
            )
            return
        try:
            acct = str(phone_to_intasend_int(phone))
        except ValueError as e:
            RentCollectionTransaction.objects.filter(pk=tx.pk).update(
                payout_status=RentCollectionTransaction.PayoutStatus.MANUAL,
                payout_error=str(e),
            )
            return

        from . import intasend_service

        RentCollectionTransaction.objects.filter(pk=tx.pk).update(
            payout_status=RentCollectionTransaction.PayoutStatus.PROCESSING,
        )
        try:
            amt = float(tx.owner_amount.quantize(Decimal("0.01")))
            resp = intasend_service.disburse_mpesa_phones(
                transactions=[
                    {
                        "name": f"Owner {prop.name[:40]}",
                        "account": acct,
                        "amount": amt,
                    }
                ],
                requires_approval="NO",
            )
            tracking = ""
            if isinstance(resp, dict):
                tracking = str(resp.get("tracking_id") or resp.get("id") or "")[:120]
            RentCollectionTransaction.objects.filter(pk=tx.pk).update(
                payout_status=RentCollectionTransaction.PayoutStatus.COMPLETED,
                payout_tracking_id=tracking,
                payout_error="",
            )
        except IntaSendAPIError as e:
            logger.exception("IntaSend owner payout failed tx=%s", tx.id)
            RentCollectionTransaction.objects.filter(pk=tx.pk).update(
                payout_status=RentCollectionTransaction.PayoutStatus.FAILED,
                payout_error=str(e)[:2000],
            )
        except Exception as e:
            logger.exception("IntaSend owner payout failed tx=%s", tx.id)
            RentCollectionTransaction.objects.filter(pk=tx.pk).update(
                payout_status=RentCollectionTransaction.PayoutStatus.FAILED,
                payout_error=str(e)[:2000],
            )
        return

    RentCollectionTransaction.objects.filter(pk=tx.pk).update(
        payout_status=RentCollectionTransaction.PayoutStatus.MANUAL,
        payout_error="Till/Paybill payout is queued for manual settlement or future wallet credit.",
    )
