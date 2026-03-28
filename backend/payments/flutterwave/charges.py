"""Initiate M-Pesa (KES) charges via Flutterwave with subaccount split."""
from __future__ import annotations

import logging
import uuid

from .http_client import request_json

logger = logging.getLogger(__name__)


def initiate_mpesa_charge(
    *,
    amount_kes: int,
    payer_phone: str,
    email: str,
    fullname: str,
    landlord_subaccount_id: str,
    tx_ref: str | None = None,
    flutterwave_customer_id: str | None = None,
) -> dict:
    """
    POST /v3/charges?type=mpesa
    Landlord split (99%) is configured on the subaccount at creation time (1% platform).
    """
    ref = tx_ref or f"rent-{uuid.uuid4().hex[:24]}"
    payload: dict = {
        "tx_ref": ref[:100],
        "amount": amount_kes,
        "currency": "KES",
        "email": email,
        "phone_number": payer_phone,
        "fullname": (fullname or "Customer")[:100],
        "subaccounts": [
            {
                "id": landlord_subaccount_id,
            }
        ],
    }
    if flutterwave_customer_id and flutterwave_customer_id.strip().isdigit():
        payload["customer"] = int(flutterwave_customer_id.strip())

    res = request_json("POST", "/charges?type=mpesa", json_body=payload)
    return res


def verify_charge_by_id(flutterwave_transaction_id: int) -> dict:
    return request_json("GET", f"/transactions/{flutterwave_transaction_id}/verify")
