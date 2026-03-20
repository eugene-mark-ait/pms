"""
Safaricom Daraja API client: OAuth token (cached) and Lipa Na M-PESA Online (STK Push).
Credentials must be set via environment variables — never hardcode secrets.

Token and STK endpoints both use the same base URL from _base_url() (sandbox vs production)
so MPESA_ENV must match your consumer key/shortcode/passkey (mixing envs causes 404.001.03).
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


def _mpesa_env_label() -> str:
    return (getattr(settings, "MPESA_ENV", "sandbox") or "sandbox").lower()


def _base_url() -> str:
    """Daraja API host; must be identical for OAuth and STK push."""
    if _mpesa_env_label() == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def invalidate_daraja_token_cache() -> None:
    """Remove cached OAuth token and expiry (e.g. after Daraja reports invalid token)."""
    cache.delete(CACHE_KEY_TOKEN)
    cache.delete(CACHE_KEY_EXP)
    logger.info(
        "Daraja token cache invalidated (keys=%s, %s)",
        CACHE_KEY_TOKEN,
        CACHE_KEY_EXP,
    )


def _is_invalid_access_token_response(status_code: int, data: Any) -> bool:
    """
    Detect Daraja 'Invalid Access Token' (e.g. 404.001.03) or HTTP 401.
    """
    if status_code == 401:
        return True
    if not isinstance(data, dict):
        return False
    code = str(data.get("errorCode") or data.get("error_code") or "")
    msg = str(data.get("errorMessage") or data.get("error_message") or "").lower()
    if "404.001.03" in code:
        return True
    if "invalid access token" in msg:
        return True
    return False


def fetch_new_token() -> tuple[str, int]:
    """
    Request a new OAuth access token from Daraja.

    Uses MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET with:
      Authorization: Basic base64(consumer_key:consumer_secret)

    Returns:
        (access_token, expires_in_seconds)

    Raises:
        RuntimeError: If credentials are missing, the HTTP call fails, or the
        response is missing required fields. Does not write to cache.
    """
    key = (getattr(settings, "MPESA_CONSUMER_KEY", "") or "").strip()
    secret = (getattr(settings, "MPESA_CONSUMER_SECRET", "") or "").strip()
    if not key or not secret:
        raise RuntimeError(
            "MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET must be set for Daraja OAuth."
        )

    base = _base_url()
    env_label = _mpesa_env_label()
    auth = base64.b64encode(f"{key}:{secret}".encode()).decode()
    url = f"{base}/oauth/v1/generate?grant_type=client_credentials"

    logger.debug(
        "Daraja OAuth request: env=%s base_url=%s (token URL must match STK base)",
        env_label,
        base,
    )

    try:
        r = requests.get(url, headers={"Authorization": f"Basic {auth}"}, timeout=30)
    except requests.RequestException as e:
        logger.exception("Daraja OAuth request failed: %s", e)
        raise RuntimeError(
            f"Failed to reach Daraja OAuth endpoint: {e}"
        ) from e

    if r.status_code >= 400:
        body_preview = (r.text or "")[:2000]
        logger.error(
            "Daraja OAuth HTTP %s response body: %s",
            r.status_code,
            body_preview,
        )
        raise RuntimeError(
            f"Daraja OAuth failed with HTTP {r.status_code}: {body_preview or 'no body'}"
        )

    try:
        data = r.json()
    except ValueError as e:
        body_preview = (r.text or "")[:2000]
        logger.exception("Daraja OAuth invalid JSON: %s", body_preview)
        raise RuntimeError("Daraja OAuth returned invalid JSON.") from e

    token = data.get("access_token")
    if not token:
        logger.error("Daraja OAuth missing access_token in body: %r", data)
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


def get_access_token(*, force_refresh: bool = False) -> str:
    """
    Return a valid OAuth access token, using Django cache until near expiry.

    Reads token from CACHE_KEY_TOKEN and UNIX expiry from CACHE_KEY_EXP.
    If the token exists and current time is before the cached expiry, returns it.
    Otherwise fetches a new token via fetch_new_token(), caches it, and returns it.

    If force_refresh is True, skips the cache lookup and always fetches a new token
    (call invalidate_daraja_token_cache() first if Daraja rejected the cached token).
    """
    base = _base_url()
    env_label = _mpesa_env_label()

    cached = cache.get(CACHE_KEY_TOKEN)
    exp = cache.get(CACHE_KEY_EXP)

    if not force_refresh and cached is not None and exp is not None:
        try:
            expiry_ts = float(exp)
        except (TypeError, ValueError):
            expiry_ts = 0.0
        if time.time() < expiry_ts:
            logger.info(
                "Daraja access token reused from cache (env=%s, base_url=%s)",
                env_label,
                base,
            )
            return str(cached)

    if force_refresh:
        logger.info(
            "Daraja access token force refresh: fetching new token (env=%s, base_url=%s)",
            env_label,
            base,
        )

    try:
        token, expires_in = fetch_new_token()
    except Exception:
        # Never cache on failure
        logger.exception(
            "Daraja access token fetch failed (env=%s); cache not updated",
            env_label,
        )
        raise

    now = time.time()
    expiry_ts = now + float(expires_in) - TOKEN_EXPIRY_SAFETY_SECONDS
    cache_timeout = int(max(expires_in - TOKEN_EXPIRY_SAFETY_SECONDS, 60))

    cache.set(CACHE_KEY_TOKEN, token, timeout=cache_timeout)
    cache.set(CACHE_KEY_EXP, expiry_ts, timeout=cache_timeout)

    logger.info(
        "Daraja access token fetched from API and cached "
        "(env=%s, base_url=%s, expires_in=%ss, cache_timeout=%ss)",
        env_label,
        base,
        expires_in,
        cache_timeout,
    )

    return token


def generate_stk_password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode("utf-8")).decode("utf-8")


def _stk_push_request(
    *,
    token: str,
    url: str,
    payload: dict[str, Any],
) -> tuple[requests.Response, dict[str, Any] | Any]:
    """POST STK push; returns (response, parsed JSON or raw)."""
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
    except ValueError:
        logger.exception("Daraja STK non-JSON response: %s", (r.text or "")[:2000])
        raise RuntimeError("Invalid response from M-PESA STK API.") from None
    return r, data


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

    On Daraja 'Invalid Access Token', cache is cleared and the request is retried once
    with a freshly fetched token.
    """
    shortcode = str(getattr(settings, "MPESA_SHORTCODE", "174379"))
    passkey = getattr(settings, "MPESA_PASSKEY", "") or ""
    if not passkey:
        raise RuntimeError("MPESA_PASSKEY must be set.")
    if not callback_url:
        raise RuntimeError("MPESA_CALLBACK_URL must be set to a publicly reachable URL for callbacks.")

    base = _base_url()
    env_label = _mpesa_env_label()
    url = f"{base}/mpesa/stkpush/v1/processrequest"
    logger.debug(
        "Daraja STK push: env=%s oauth_and_stk_base_url=%s",
        env_label,
        base,
    )

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

    token = get_access_token()
    r, data = _stk_push_request(token=token, url=url, payload=payload)

    if _is_invalid_access_token_response(r.status_code, data):
        logger.warning(
            "Daraja STK invalid/expired access token (first attempt). "
            "Invalidating cache and retrying once. status=%s body=%s",
            r.status_code,
            data,
        )
        invalidate_daraja_token_cache()
        token = get_access_token(force_refresh=True)
        r, data = _stk_push_request(token=token, url=url, payload=payload)
        if _is_invalid_access_token_response(r.status_code, data):
            logger.error(
                "Daraja STK invalid access token after refresh. status=%s body=%s",
                r.status_code,
                data,
            )
            raise RuntimeError(
                data.get("errorMessage")
                or data.get("requestId")
                or "M-PESA rejected the access token after refresh (check MPESA_ENV, consumer key/secret, and that sandbox vs production match)."
            )

    if r.status_code >= 400:
        logger.warning(
            "Daraja STK HTTP %s error body: %s",
            r.status_code,
            data,
        )
        raise RuntimeError(
            data.get("errorMessage")
            or data.get("requestId")
            or "STK push request failed."
        )

    return data  # type: ignore[return-value]


def stk_amount_kes(amount: Decimal | float | int) -> int:
    """Whole shillings for STK (Daraja expects integer)."""
    d = Decimal(str(amount))
    return int(d.quantize(Decimal("1")))
