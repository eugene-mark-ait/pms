"""Create Flutterwave customers for tenants (stores customer id on User)."""
from __future__ import annotations

import logging

from django.contrib.auth import get_user_model

from .http_client import request_json

logger = logging.getLogger(__name__)
UserModel = get_user_model()


def ensure_flutterwave_customer(user) -> str | None:
    """
    Create a Flutterwave customer if missing. Returns customer id string or None if not configured / skipped.
    """
    from .oauth import flutterwave_configured

    if not flutterwave_configured():
        return None
    existing = (getattr(user, "flutterwave_customer_id", None) or "").strip()
    if existing:
        return existing

    from ..kenya_phone import normalize_ke_mpesa_phone_loose

    phone = normalize_ke_mpesa_phone_loose((user.phone or "").strip())
    if not phone:
        logger.warning("Skipping Flutterwave customer: user %s has no valid KE phone.", user.pk)
        return None

    fullname = f"{user.first_name or ''} {user.last_name or ''}".strip() or user.email.split("@")[0]
    payload = {
        "email": user.email,
        "phone_number": phone,
        "fullname": fullname[:100],
        "country": "KE",
    }
    try:
        res = request_json("POST", "/customers", json_body=payload)
    except Exception as e:
        logger.exception("Flutterwave customer create failed for user %s: %s", user.pk, e)
        return None

    data = res.get("data") or {}
    cid = data.get("id") or data.get("customer_id")
    if cid is None:
        logger.error("Flutterwave customer response missing id: %s", res)
        return None
    cid_str = str(cid)
    UserModel.objects.filter(pk=user.pk).update(flutterwave_customer_id=cid_str)
    user.flutterwave_customer_id = cid_str
    return cid_str
