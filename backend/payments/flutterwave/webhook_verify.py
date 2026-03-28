"""Verify flutterwave-signature header (HMAC-SHA256 of raw body, base64)."""
from __future__ import annotations

import base64
import hashlib
import hmac


def verify_flutterwave_signature(raw_body: bytes, signature_header: str | None, secret_hash: str) -> bool:
    if not secret_hash or not signature_header:
        return False
    digest = hmac.new(secret_hash.encode("utf-8"), raw_body, hashlib.sha256).digest()
    expected_b64 = base64.b64encode(digest).decode("ascii")
    return hmac.compare_digest(expected_b64.strip(), signature_header.strip())
