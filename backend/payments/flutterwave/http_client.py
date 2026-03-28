"""Low-level JSON calls to api.flutterwave.com/v3 with OAuth Bearer token."""
from __future__ import annotations

import logging
from typing import Any

import requests
from django.conf import settings

from .oauth import get_access_token

logger = logging.getLogger(__name__)


def _base_url() -> str:
    return (getattr(settings, "FLUTTERWAVE_BASE_URL", None) or "https://api.flutterwave.com/v3").rstrip("/")


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {get_access_token()}",
        "Content-Type": "application/json",
    }


def request_json(
    method: str,
    path: str,
    *,
    params: dict[str, Any] | None = None,
    json_body: dict[str, Any] | None = None,
    timeout: int = 45,
) -> dict[str, Any]:
    url = f"{_base_url()}{path}" if path.startswith("/") else f"{_base_url()}/{path}"
    resp = requests.request(
        method.upper(),
        url,
        params=params,
        json=json_body,
        headers=_headers(),
        timeout=timeout,
    )
    try:
        out = resp.json()
    except ValueError:
        logger.error("Flutterwave non-JSON response %s: %s", resp.status_code, resp.text[:500])
        raise RuntimeError("Invalid response from Flutterwave.") from None

    if resp.status_code >= 400:
        logger.warning(
            "Flutterwave API error %s %s: %s",
            method,
            path,
            str(out)[:800],
        )
        raise RuntimeError(out.get("message") or f"Flutterwave HTTP {resp.status_code}")

    return out if isinstance(out, dict) else {"_raw": out}
