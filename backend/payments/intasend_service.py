"""
IntaSend API wrapper — collection (M-Pesa STK) and disbursement.

Auth: REST uses ``Authorization: Bearer <secret>`` — the Python SDK takes the secret as ``token``.
See https://developers.intasend.com/docs/authentication

Sandbox vs live: use test keys + ``test=True`` for sandbox; live keys + ``test=False`` for production.
See https://developers.intasend.com/docs/api-testing-and-sandbox

Errors: failed responses often include ``type`` and ``errors[]`` with ``code`` / ``detail``.
See https://developers.intasend.com/docs/errors-references
"""
from __future__ import annotations

import logging
from decimal import Decimal
from typing import Any

from django.conf import settings

logger = logging.getLogger(__name__)


class IntaSendAPIError(Exception):
    """Raised when IntaSend returns a client/server error payload or the SDK raises."""

    def __init__(self, message: str, *, raw: Any = None, http_status: int | None = None) -> None:
        super().__init__(message)
        self.raw = raw
        self.http_status = http_status


def _format_error_payload(resp: dict[str, Any]) -> str:
    """Human-readable message from IntaSend ``errors`` list or top-level detail."""
    if resp.get("detail") and isinstance(resp["detail"], str):
        return resp["detail"][:500]
    errs = resp.get("errors")
    if isinstance(errs, list) and errs:
        parts = []
        for e in errs[:5]:
            if isinstance(e, dict):
                code = e.get("code") or ""
                detail = e.get("detail") or ""
                parts.append(f"{code}: {detail}".strip(": ").strip())
            else:
                parts.append(str(e))
        return "; ".join(parts)[:500]
    return resp.get("message", "IntaSend request failed")[:500]


def response_indicates_api_error(resp: Any) -> bool:
    """
    Detect IntaSend error JSON (https://developers.intasend.com/docs/errors-references).
    """
    if not isinstance(resp, dict):
        return False
    if resp.get("type") in ("client_error", "server_error"):
        return True
    errs = resp.get("errors")
    if isinstance(errs, list) and len(errs) > 0:
        return True
    return False


def extract_invoice_id_safe(resp: dict[str, Any]) -> str:
    """Best-effort invoice id from STK / collection response."""
    inv = resp.get("invoice_id") or resp.get("id")
    if inv is not None and str(inv).strip():
        return str(inv).strip()
    inv_obj = resp.get("invoice")
    if isinstance(inv_obj, dict):
        return str(inv_obj.get("id") or inv_obj.get("invoice_id") or "").strip()
    return ""


def ensure_ok_response(resp: Any, *, operation: str) -> dict[str, Any]:
    """Normalize to dict; raise IntaSendAPIError on documented error shape."""
    if not isinstance(resp, dict):
        raise IntaSendAPIError(f"IntaSend {operation}: unexpected response type", raw=resp)
    if response_indicates_api_error(resp):
        msg = _format_error_payload(resp)
        raise IntaSendAPIError(msg or f"IntaSend {operation} failed", raw=resp)
    return resp


def intasend_configured() -> bool:
    try:
        import intasend  # noqa: F401
    except ImportError:
        logger.warning("intasend-python not installed; pip install intasend-python")
        return False
    pub = (getattr(settings, "INTASEND_PUBLISHABLE_KEY", "") or "").strip()
    sec = (getattr(settings, "INTASEND_SECRET_KEY", "") or "").strip()
    if not (pub and sec):
        return False
    test_mode = bool(getattr(settings, "INTASEND_TEST_MODE", True))
    # Keys are prefixed ISPublKey_ / ISSecretKey_ — environment hints in key string per IntaSend docs
    key_blob = (pub + sec).lower()
    if test_mode and "live" in key_blob and "test" not in key_blob[:20]:
        logger.warning(
            "INTASEND_TEST_MODE is True but keys may be live — use sandbox keys from "
            "https://sandbox.intasend.com/ or set INTASEND_TEST_MODE=false for production."
        )
    if not test_mode and "test" in key_blob and "sandbox" in key_blob:
        logger.warning(
            "INTASEND_TEST_MODE is False but keys look like sandbox/test — check environment alignment."
        )
    return True


def _service():
    from intasend import APIService

    return APIService(
        token=(getattr(settings, "INTASEND_SECRET_KEY", "") or "").strip(),
        publishable_key=(getattr(settings, "INTASEND_PUBLISHABLE_KEY", "") or "").strip(),
        test=bool(getattr(settings, "INTASEND_TEST_MODE", True)),
    )


def mpesa_stk_push(
    *,
    phone_number: int | str,
    email: str,
    amount_kes: Decimal | float | int,
    narrative: str,
    api_ref: str,
) -> dict[str, Any]:
    """
    Trigger M-Pesa STK push (https://developers.intasend.com/docs/m-pesa-stk-push).
    Funds settle per your IntaSend account / wallet configuration.
    """
    svc = _service()
    amt = float(Decimal(str(amount_kes)).quantize(Decimal("0.01")))
    phone = int(str(phone_number).strip())
    base_kw: dict[str, Any] = {
        "phone_number": phone,
        "email": email or "tenant@mahaliwise.local",
        "amount": amt,
        "narrative": (narrative or "Rent")[:100],
    }
    try:
        try:
            resp = svc.collect.mpesa_stk_push(**base_kw, api_ref=api_ref[:80])
        except TypeError:
            resp = svc.collect.mpesa_stk_push(**base_kw)
    except Exception as e:
        logger.exception("IntaSend mpesa_stk_push SDK error")
        raise IntaSendAPIError(str(e), raw=None) from e

    resp = ensure_ok_response(resp, operation="mpesa_stk_push")
    inv = extract_invoice_id_safe(resp)
    if not inv:
        raise IntaSendAPIError(
            "IntaSend STK did not return an invoice id. Check response.",
            raw=resp,
        )
    return resp


def collect_status(*, invoice_id: str) -> dict[str, Any]:
    """Payment / invoice status (https://developers.intasend.com/docs/payment-status)."""
    svc = _service()
    try:
        resp = svc.collect.status(invoice_id=invoice_id)
    except Exception as e:
        logger.exception("IntaSend collect.status SDK error")
        raise IntaSendAPIError(str(e), raw=None) from e
    if not isinstance(resp, dict):
        raise IntaSendAPIError("collect.status returned non-dict", raw=resp)
    # Status endpoint may return 200 with error payload for some failures
    if response_indicates_api_error(resp):
        raise IntaSendAPIError(_format_error_payload(resp), raw=resp)
    return resp


def disburse_mpesa_phones(
    *,
    transactions: list[dict[str, Any]],
    requires_approval: str = "NO",
) -> dict[str, Any]:
    """
    Send money to M-Pesa numbers (B2C-style; see https://developers.intasend.com/docs/m-pesa-b2c).
    Each item: name, account (254...), amount (float).
    """
    svc = _service()
    try:
        resp = svc.transfer.mpesa(
            currency="KES",
            transactions=transactions,
            requires_approval=requires_approval,
        )
    except Exception as e:
        logger.exception("IntaSend transfer.mpesa SDK error")
        raise IntaSendAPIError(str(e), raw=None) from e
    return ensure_ok_response(resp, operation="transfer.mpesa") if isinstance(resp, dict) else resp


def transfer_status(*, tracking_id: str) -> dict[str, Any]:
    """Itemized payout status (https://developers.intasend.com/docs/payment-statuses-reference)."""
    svc = _service()
    try:
        resp = svc.transfer.status(tracking_id=tracking_id)
    except Exception as e:
        logger.exception("IntaSend transfer.status SDK error")
        raise IntaSendAPIError(str(e), raw=None) from e
    if isinstance(resp, dict) and response_indicates_api_error(resp):
        raise IntaSendAPIError(_format_error_payload(resp), raw=resp)
    return resp if isinstance(resp, dict) else {"raw": resp}
