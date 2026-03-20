"""
Safaricom Daraja API client: OAuth token (cached) and Lipa Na M-PESA Online (STK Push).
Credentials must be set via environment variables — never hardcode secrets.
"""
from __future__ import annotations

import base64
import logging
from datetime import datetime
from decimal import Decimal
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_KEY_TOKEN = "daraja:access_token"
CACHE_KEY_TOKEN_EXP = "daraja:access_token_expires_at"


def _base_url() -> str:
    env = (getattr(settings, "MPESA_ENV", "sandbox") or "sandbox").lower()
    if env == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def get_access_token() -> str:
    """Return a valid OAuth access token, using Django cache until near expiry."""
    cached = cache.get(CACHE_KEY_TOKEN)
    exp = cache.get(CACHE_KEY_EXP) or 0
    import time

    if cached and time.time() < (exp - 120):
        return cached

    key = getattr(settings, "MPESA_CONSUMER_KEY", "") or ""
    secret = getattr(settings, "MPESA_CONSUMER_SECRET", "") or ""
    if not key or not secret:
        raise RuntimeError("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set.")

    auth = base64.b64encode(f"{key}:{secret}".encode()).decode()
    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"
    r = requests.get(url, headers={"Authorization": f"Basic {auth}"}, timeout=30)
    r.raise_for_status()
    data = r.json()
    token = data.get("access_token")
    expires_in = int(data.get("expires_in", 3599))
    if not token:
        raise RuntimeError(f"Daraja token response missing access_token: {data}")

    import time

    cache.set(CACHE_KEY_TOKEN, token, timeout=expires_in)
    cache.set(CACHE_KEY_TOKEN_EXP, time.time() + expires_in, timeout=expires_in)
    return token


def generate_stk_password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode("utf-8")).decode("utf-8")


def stk_push(
    *,
    phone: str,
    amount: int,
    account_reference: str,
    transaction_desc: str,
    callback_url: str,
) -> dict[str, Any]:
    """
    Initiate STK Push. Amount must be a positive integer (KES).
    Returns Daraja JSON (MerchantRequestID, CheckoutRequestID, ResponseCode, etc.).
    """
    shortcode = str(getattr(settings, "MPESA_SHORTCODE", "174379"))
    passkey = getattr(settings, "MPESA_PASSKEY", "") or ""
    if not passkey:
        raise RuntimeError("MPESA_PASSKEY must be set.")
    if not callback_url:
        raise RuntimeError("MPESA_CALLBACK_URL must be set to a publicly reachable URL for callbacks.")

    token = get_access_token()
    ts = datetime.now().strftime("%Y%m%d%H%M%S")
    password = generate_stk_password(shortcode, passkey, ts)

    payload = {
        "BusinessShortCode": int(shortcode),
        "Password": password,
        "Timestamp": ts,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": int(phone),
        "PartyB": int(shortcode),
        "PhoneNumber": int(phone),
        "CallBackURL": callback_url,
        "AccountReference": account_reference[:12] if account_reference else "RENT",
        "TransactionDesc": (transaction_desc or "Rent Payment")[:13],
    }

    url = f"{_base_url()}/mpesa/stkpush/v1/processrequest"
    r = requests.post(
        url,
        json=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        },
        timeout=45,
    )
    try:
        data = r.json()
    except Exception:
        logger.exception("Daraja STK non-JSON response: %s", r.text[:500])
        raise RuntimeError("Invalid response from M-PESA STK API.") from None

    if r.status_code >= 400:
        logger.warning("Daraja STK HTTP %s: %s", r.status_code, data)
        raise RuntimeError(data.get("errorMessage") or data.get("requestId") or "STK push request failed.")

    return data


def stk_amount_kes(amount: Decimal | float | int) -> int:
    """Whole shillings for STK (Daraja expects integer)."""
    d = Decimal(str(amount))
    return int(d.quantize(Decimal("1")))
