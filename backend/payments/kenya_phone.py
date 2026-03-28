"""Kenyan MSISDN normalization and validation for M-Pesa / Flutterwave (2547XXXXXXXX)."""
from __future__ import annotations

import re

# Safaricom-style: 254 + 7 + 8 digits (12 digits total).
KE_PAYMENT_PHONE_RE = re.compile(r"^2547\d{8}$")


def normalize_kenya_payment_phone(value: str | None) -> str | None:
    """
    Normalize user input to 2547XXXXXXXX.
    Accepts local 07…, 7…, +254…, spaces/dashes.
    """
    if not value or not str(value).strip():
        return None
    p = str(value).strip().replace("+", "").replace(" ", "").replace("-", "")
    if p.startswith("0") and len(p) == 10:
        p = "254" + p[1:]
    if len(p) == 9 and p.startswith("7"):
        p = "254" + p
    if len(p) == 10 and p.startswith("07"):
        p = "254" + p[1:]
    if KE_PAYMENT_PHONE_RE.match(p):
        return p
    return None


def validate_kenya_payment_phone(value: str | None) -> str:
    """Return normalized phone or raise ValueError."""
    n = normalize_kenya_payment_phone(value)
    if not n:
        raise ValueError("Enter a valid Kenyan payment number in format 2547XXXXXXXX.")
    return n


KE_MPESA_LOOSE_RE = re.compile(r"^254[17]\d{8}$")


def normalize_ke_mpesa_phone_loose(value: str | None) -> str | None:
    """Normalize to 254[17]XXXXXXXX for payer/tenant lines (Safaricom / Airtel)."""
    if not value or not str(value).strip():
        return None
    p = str(value).strip().replace("+", "").replace(" ", "").replace("-", "")
    if p.startswith("0") and len(p) == 10:
        p = "254" + p[1:]
    if len(p) == 9 and p.startswith("7"):
        p = "254" + p
    if len(p) == 10 and p.startswith("07"):
        p = "254" + p[1:]
    if KE_MPESA_LOOSE_RE.match(p):
        return p
    return None
