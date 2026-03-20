"""
Safaricom Daraja API client: OAuth token (cached) and Lipa Na M-PESA Online (STK Push).
Credentials must be set via environment variables — never hardcode secrets.
"""
from __future__ import annotations

import base64
import logging
import time
from datetime import datetime
from decimal import Decimal
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Django cache keys for OAuth token (must match get_access_token / fetch_new_token usage)
CACHE_KEY_TOKEN = "daraja_access_token"
CACHE_KEY_EXP = "daraja_access_token_expiry"

# Refresh this many seconds before Safaricom's stated expiry to avoid edge 401s
TOKEN_EXPIRY_SAFETY_SECONDS = 60


def _base_url() -> str:
    env = (getattr(settings, "MPESA_ENV", "sandbox") or "sandbox").lower()
    if env == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def fetch_new_token() -> tuple[str, int]:
    """
    Request a new OAuth access token from Daraja.

    Returns:
        (access_token, expires_in_seconds)

    Raises:
        RuntimeError: If credentials are missing, the HTTP call fails, or the
        response is missing required fields.
    """
    key = getattr(settings, "MPESA_CONSUMER_KEY", "") or ""
    secret = getattr(settings, "MPESA_CONSUMER_SECRET", "") or ""
    if not key or not secret:
        raise RuntimeError(
            "MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set for Daraja OAuth."
        )

    auth = base64.b64encode(f"{key}:{secret}".encode()).decode()
    url = f"{_base_url()}/oauth/v1/generate?grant_type=client_credentials"

    try:
        r = requests.get(url, headers={"Authorization": f"Basic {auth}"}, timeout=30)
    except requests.RequestException as e:
        logger.exception("Daraja OAuth request failed: %s", e)
        raise RuntimeError(
            f"Failed to reach Daraja OAuth endpoint: {e}"
        ) from e

    if r.status_code >= 400:
        body_preview = (r.text or "")[:500]
        logger.error(
            "Daraja OAuth HTTP %s: %s",
            r.status_code,
            body_preview,
        )
        raise RuntimeError(
            f"Daraja OAuth failed with HTTP {r.status_code}: {body_preview or 'no body'}"
        )

    try:
        data = r.json()
    except ValueError as e:
        logger.exception("Daraja OAuth invalid JSON: %s", (r.text or "")[:500])
        raise RuntimeError("Daraja OAuth returned invalid JSON.") from e

    token = data.get("access_token")
    if not token:
        raise RuntimeError(
            f"Daraja token response missing access_token: {data!r}"
        )

    raw_expires = data.get("expires_in", 3599)
    try:
        expires_in = int(raw_expires)
    except (TypeError, ValueError) as e:
        raise RuntimeError(
            f"Daraja token response has invalid expires_in: {raw_expires!r}"
        ) from e

    if expires_in <= 0:
        raise RuntimeError(
            f"Daraja token response has non-positive expires_in: {expires_in}"
        )

    return str(token), expires_in


def get_access_token() -> str:
    """
    Return a valid OAuth access token, using Django cache until near expiry.

    Reads token from CACHE_KEY_TOKEN and UNIX expiry from CACHE_KEY_EXP.
    If the token exists and current time is before the cached expiry, returns it.
    Otherwise fetches a new token via fetch_new_token(), caches it, and returns it.
    """
    cached = cache.get(CACHE_KEY_TOKEN)
    exp = cache.get(CACHE_KEY_EXP)

    if cached is not None and exp is not None:
        try:
            expiry_ts = float(exp)
        except (TypeError, ValueError):
            expiry_ts = 0.0
        if time.time() < expiry_ts:
            return str(cached)

    token, expires_in = fetch_new_token()
    now = time.time()
    # Store deadline: treat token as expired TOKEN_EXPIRY_SAFETY_SECONDS before Safaricom
    expiry_ts = now + float(expires_in) - TOKEN_EXPIRY_SAFETY_SECONDS

    # Cache TTL: keep entries until our conservative expiry (at least 60s)
    cache_timeout = int(max(expires_in - TOKEN_EXPIRY_SAFETY_SECONDS, 60))

    cache.set(CACHE_KEY_TOKEN, token, timeout=cache_timeout)
    cache.set(CACHE_KEY_EXP, expiry_ts, timeout=cache_timeout)

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
