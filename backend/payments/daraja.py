"""
Safaricom Daraja API client: OAuth token (cached) and Lipa Na M-PESA Online (STK Push).
Credentials must be set via environment variables — never hardcode secrets.

OAuth and STK must use the same host: sandbox https://sandbox.safaricom.co.ke or
production https://api.safaricom.co.ke. Mixing sandbox keys with production base (or vice versa)
causes Invalid Access Token (404.001.03).

STK Password = Base64(BusinessShortCode + PassKey + Timestamp) with Timestamp in
YYYYMMDDHHmmss using MPESA_STK_TIMESTAMP_TZ (default Africa/Nairobi — Safaricom Kenya local time).
"""
from __future__ import annotations

import base64
import logging
import time
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_KEY_TOKEN = "daraja_access_token"
CACHE_KEY_EXP = "daraja_access_token_expiry"
TOKEN_EXPIRY_SAFETY_SECONDS = 60

SANDBOX_SHORTCODE = "174379"


def _mpesa_env_label() -> str:
    v = (getattr(settings, "MPESA_ENV", "sandbox") or "sandbox").strip().lower()
    if v in ("production", "prod", "live"):
        return "production"
    return "sandbox"


def _base_url() -> str:
    """Daraja API host; identical for OAuth token and STK push."""
    if _mpesa_env_label() == "production":
        return "https://api.safaricom.co.ke"
    return "https://sandbox.safaricom.co.ke"


def _daraja_token_cache_bypass() -> bool:
    """When True, never read/write OAuth token cache (sandbox debugging)."""
    return bool(getattr(settings, "MPESA_DARAJA_BYPASS_TOKEN_CACHE", False))


def _stk_timestamp_string() -> str:
    """YYYYMMDDHHmmss in configured TZ (default Africa/Nairobi for Daraja STK)."""
    tz_name = (getattr(settings, "MPESA_STK_TIMESTAMP_TZ", "Africa/Nairobi") or "Africa/Nairobi").strip()
    try:
        tz = ZoneInfo(tz_name)
        return datetime.now(tz).strftime("%Y%m%d%H%M%S")
    except ZoneInfoNotFoundError:
        logger.warning(
            "MPESA_STK_TIMESTAMP_TZ %r not found (install tzdata on Windows?). Using UTC — "
            "if STK fails with wrong password, set MPESA_STK_TIMESTAMP_TZ=Africa/Nairobi with tzdata.",
            tz_name,
        )
        return datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S")


def invalidate_daraja_token_cache() -> None:
    cache.delete(CACHE_KEY_TOKEN)
    cache.delete(CACHE_KEY_EXP)
    logger.info(
        "Daraja token cache invalidated (keys=%s, %s)",
        CACHE_KEY_TOKEN,
        CACHE_KEY_EXP,
    )


def _is_invalid_access_token_response(status_code: int, data: Any) -> bool:
    """True for 401 or Daraja 404.001.03 / Invalid Access Token (including some HTTP 200 JSON bodies)."""
    if status_code == 401:
        return True
    if not isinstance(data, dict):
        return False
    code = str(data.get("errorCode") or data.get("error_code") or "")
    msg = str(data.get("errorMessage") or data.get("error_message") or data.get("errorDescription") or "").lower()
    # Some responses nest or use requestId with message text
    if "404.001.03" in code:
        return True
    if "invalid access token" in msg:
        return True
    return False


def normalize_kenya_stk_phone(phone: str | int) -> str:
    """
    MSISDN for PartyA / PhoneNumber: digits only, must start with 254 (Kenya).
    Accepts 0712345678 style and normalizes to 254712345678.
    """
    s = str(phone).strip().replace(" ", "").replace("-", "")
    if s.startswith("+"):
        s = s[1:]
    if s.startswith("0") and len(s) >= 9:
        s = "254" + s[1:]
    if not s.isdigit():
        raise RuntimeError(
            "M-PESA STK phone must contain digits only (Kenya 254…). "
            f"Got {phone!r}."
        )
    if not s.startswith("254"):
        raise RuntimeError(
            "M-PESA STK requires a Kenya number starting with country code 254 "
            "(e.g. 254708374149). Off-net formats like 07… are converted automatically."
        )
    if len(s) < 12:
        raise RuntimeError(
            f"M-PESA STK phone looks too short after normalization: {s!r} (expected 254 + 9 digits)."
        )
    return s


def _validate_callback_https(callback_url: str) -> None:
    u = (callback_url or "").strip()
    if not u.lower().startswith("https://"):
        raise RuntimeError(
            "MPESA_CALLBACK_URL must be a full HTTPS URL (Daraja rejects plain HTTP). "
            f"Got: {callback_url!r}"
        )


def _validate_env_matches_shortcode() -> None:
    env = _mpesa_env_label()
    sc = str(getattr(settings, "MPESA_SHORTCODE", SANDBOX_SHORTCODE) or SANDBOX_SHORTCODE).strip()
    if env == "sandbox" and sc != SANDBOX_SHORTCODE:
        raise RuntimeError(
            f"Sandbox Daraja requires Business Shortcode {SANDBOX_SHORTCODE} with sandbox consumer "
            f"key/secret and passkey. MPESA_SHORTCODE is {sc!r} — mismatch causes invalid tokens or STK errors."
        )
    if env == "production" and sc == SANDBOX_SHORTCODE:
        logger.warning(
            "MPESA_ENV=production but MPESA_SHORTCODE is sandbox test till %s — use your live Paybill/Till.",
            SANDBOX_SHORTCODE,
        )


def fetch_new_token() -> tuple[str, int]:
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

    logger.info(
        "Daraja OAuth: fetching token env=%s base_url=%s",
        env_label,
        base,
    )

    try:
        r = requests.get(url, headers={"Authorization": f"Basic {auth}"}, timeout=30)
    except requests.RequestException as e:
        logger.exception("Daraja OAuth request failed: %s", e)
        raise RuntimeError(f"Failed to reach Daraja OAuth endpoint: {e}") from e

    if r.status_code >= 400:
        body_preview = (r.text or "")[:2000]
        logger.error("Daraja OAuth HTTP %s body: %s", r.status_code, body_preview)
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
        logger.error("Daraja OAuth missing access_token: %r", data)
        raise RuntimeError(f"Daraja token response missing access_token: {data!r}")

    raw_expires = data.get("expires_in", 3599)
    try:
        expires_in = int(raw_expires)
    except (TypeError, ValueError) as e:
        raise RuntimeError(
            f"Daraja token response has invalid expires_in: {raw_expires!r}"
        ) from e

    if expires_in <= 0:
        raise RuntimeError(f"Daraja token response has non-positive expires_in: {expires_in}")

    return str(token), expires_in


def get_access_token(*, force_refresh: bool = False) -> str:
    """
    Return OAuth access token. Cached unless MPESA_DARAJA_BYPASS_TOKEN_CACHE is True.

    force_refresh: invalidate cache first, then fetch a new token (no stale reads).
    """
    base = _base_url()
    env_label = _mpesa_env_label()

    if _daraja_token_cache_bypass():
        logger.warning(
            "MPESA_DARAJA_BYPASS_TOKEN_CACHE=1 — OAuth token cache skipped (sandbox testing only)"
        )
        token, _expires_in = fetch_new_token()
        return token

    if force_refresh:
        invalidate_daraja_token_cache()

    cached = cache.get(CACHE_KEY_TOKEN)
    exp = cache.get(CACHE_KEY_EXP)

    if not force_refresh and cached is not None and exp is not None:
        try:
            expiry_ts = float(exp)
        except (TypeError, ValueError):
            expiry_ts = 0.0
        if time.time() < expiry_ts:
            logger.info(
                "Daraja access token reused from cache (env=%s base_url=%s)",
                env_label,
                base,
            )
            return str(cached)

    if force_refresh:
        logger.info(
            "Daraja access token force refresh (env=%s base_url=%s)",
            env_label,
            base,
        )

    try:
        token, expires_in = fetch_new_token()
    except Exception:
        logger.exception("Daraja access token fetch failed env=%s; not caching", env_label)
        raise

    now = time.time()
    expiry_ts = now + float(expires_in) - TOKEN_EXPIRY_SAFETY_SECONDS
    cache_timeout = int(max(expires_in - TOKEN_EXPIRY_SAFETY_SECONDS, 60))
    cache.set(CACHE_KEY_TOKEN, token, timeout=cache_timeout)
    cache.set(CACHE_KEY_EXP, expiry_ts, timeout=cache_timeout)

    logger.info(
        "Daraja access token cached (env=%s base_url=%s expires_in=%ss)",
        env_label,
        base,
        expires_in,
    )
    return token


def generate_stk_password(shortcode: str, passkey: str, timestamp: str) -> str:
    raw = f"{shortcode}{passkey}{timestamp}"
    return base64.b64encode(raw.encode("utf-8")).decode("utf-8")


def _build_stk_payload(
    *,
    phone_digits: str,
    shortcode: str,
    passkey: str,
    amount: int,
    account_reference: str,
    transaction_desc: str,
    callback_url: str,
) -> tuple[dict[str, Any], str]:
    ts = _stk_timestamp_string()
    password = generate_stk_password(shortcode, passkey, ts)
    payload: dict[str, Any] = {
        "BusinessShortCode": int(shortcode),
        "Password": password,
        "Timestamp": ts,
        "TransactionType": "CustomerPayBillOnline",
        "Amount": int(amount),
        "PartyA": int(phone_digits),
        "PartyB": int(shortcode),
        "PhoneNumber": int(phone_digits),
        "CallBackURL": callback_url.strip(),
        "AccountReference": (account_reference or "TEST")[:12],
        "TransactionDesc": (transaction_desc or "Payment")[:13],
    }
    return payload, ts


def _stk_push_request(
    *,
    token: str,
    url: str,
    payload: dict[str, Any],
) -> tuple[requests.Response, dict[str, Any] | Any]:
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
        logger.exception("Daraja STK non-JSON: %s", (r.text or "")[:2000])
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
    STK Push Lipa Na M-PESA Online. Returns full Daraja JSON (MerchantRequestID, CheckoutRequestID, …).

    On 404.001.03 / Invalid Access Token: invalidate cache, force new OAuth token, rebuild STK
    payload (fresh Timestamp/Password), retry once.
    """
    _validate_env_matches_shortcode()
    _validate_callback_https(callback_url)

    shortcode = str(getattr(settings, "MPESA_SHORTCODE", SANDBOX_SHORTCODE) or SANDBOX_SHORTCODE).strip()
    passkey = (getattr(settings, "MPESA_PASSKEY", "") or "").strip()
    if not passkey:
        raise RuntimeError("MPESA_PASSKEY must be set.")

    phone_digits = normalize_kenya_stk_phone(phone)

    base = _base_url()
    env_label = _mpesa_env_label()
    stk_url = f"{base}/mpesa/stkpush/v1/processrequest"

    def post_stk(*, force_new_oauth: bool) -> tuple[requests.Response, Any, str, str]:
        """Build fresh Timestamp/Password, obtain token, POST STK."""
        payload, ts = _build_stk_payload(
            phone_digits=phone_digits,
            shortcode=shortcode,
            passkey=passkey,
            amount=amount,
            account_reference=account_reference,
            transaction_desc=transaction_desc,
            callback_url=callback_url,
        )
        if force_new_oauth:
            tok = get_access_token(force_refresh=True)
        else:
            tok = get_access_token()
        logger.info(
            "Daraja STK POST env=%s base_url=%s shortcode=%s timestamp=%s amount=%s oauth_fresh=%s",
            env_label,
            base,
            shortcode,
            ts,
            amount,
            force_new_oauth,
        )
        r, data = _stk_push_request(token=tok, url=stk_url, payload=payload)
        return r, data, ts, tok

    r, data, ts, token = post_stk(force_new_oauth=False)

    if _is_invalid_access_token_response(r.status_code, data):
        logger.warning(
            "Daraja invalid access token; fresh OAuth + new STK password, retry once. status=%s body=%s",
            r.status_code,
            data,
        )
        # get_access_token(force_refresh=True) clears cache then fetches from sandbox/production base
        r, data, ts, token = post_stk(force_new_oauth=True)

    if _is_invalid_access_token_response(r.status_code, data):
        tok_prefix = token[:10] if len(token) >= 10 else token
        logger.error(
            "STK push failed (invalid token after refresh): token_prefix=%s shortcode=%s "
            "timestamp=%s env=%s base_url=%s http_status=%s daraja=%s",
            tok_prefix,
            shortcode,
            ts,
            env_label,
            base,
            r.status_code,
            data,
        )
        raise RuntimeError(
            data.get("errorMessage")
            or data.get("requestId")
            or (
                "M-PESA Daraja rejected the OAuth token (404.001.03). "
                "Confirm MPESA_ENV=sandbox with sandbox consumer key/secret, shortcode 174379, "
                "and sandbox passkey; OAuth and STK must both use https://sandbox.safaricom.co.ke."
            )
        )

    if r.status_code >= 400:
        tok_prefix = (token[:10] + "…") if len(token) > 10 else token
        logger.error(
            "STK HTTP %s token_prefix=%s env=%s shortcode=%s timestamp=%s body=%s",
            r.status_code,
            tok_prefix,
            env_label,
            shortcode,
            ts,
            data,
        )
        raise RuntimeError(
            data.get("errorMessage")
            or data.get("requestId")
            or f"STK push failed (HTTP {r.status_code})."
        )

    if not isinstance(data, dict):
        raise RuntimeError(f"Unexpected STK response type: {type(data).__name__}")

    return data


def stk_amount_kes(amount: Decimal | float | int) -> int:
    d = Decimal(str(amount))
    return int(d.quantize(Decimal("1")))
