"""OAuth2 client credentials for Flutterwave API (token cached until ~1 min before expiry)."""
from __future__ import annotations

import logging
import time
from typing import Any

import requests
from django.conf import settings
from django.core.cache import cache

logger = logging.getLogger(__name__)

CACHE_KEY = "flutterwave:oauth_access_token"
TOKEN_URL = "https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token"
REFRESH_MARGIN_SEC = 60


def _credentials() -> tuple[str, str] | None:
    cid = (getattr(settings, "FLUTTERWAVE_CLIENT_ID", None) or "").strip()
    csec = (getattr(settings, "FLUTTERWAVE_CLIENT_SECRET", None) or "").strip()
    if not cid or not csec:
        return None
    return cid, csec


def get_access_token() -> str:
    """Return a valid Bearer token, refreshing from Keycloak when needed."""
    creds = _credentials()
    if not creds:
        raise RuntimeError(
            "Flutterwave OAuth is not configured (FLUTTERWAVE_CLIENT_ID / FLUTTERWAVE_CLIENT_SECRET)."
        )

    cached = cache.get(CACHE_KEY)
    if isinstance(cached, dict) and cached.get("token") and cached.get("exp_ts", 0) > time.time():
        return cached["token"]

    client_id, client_secret = creds
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "client_credentials",
            "client_id": client_id,
            "client_secret": client_secret,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=30,
    )
    if resp.status_code != 200:
        logger.error("Flutterwave OAuth failed: %s %s", resp.status_code, resp.text[:500])
        raise RuntimeError("Could not obtain Flutterwave access token.")

    data: dict[str, Any] = resp.json()
    token = data.get("access_token")
    expires_in = int(data.get("expires_in") or 600)
    if not token:
        raise RuntimeError("Flutterwave OAuth response missing access_token.")

    # Refresh at least REFRESH_MARGIN_SEC before expiry
    ttl = max(30, expires_in - REFRESH_MARGIN_SEC)
    exp_ts = time.time() + ttl
    cache.set(CACHE_KEY, {"token": token, "exp_ts": exp_ts}, timeout=int(ttl))
    return token


def flutterwave_configured() -> bool:
    return _credentials() is not None
