# Daraja sandbox STK (Lipa Na M-PESA Online)

## Environment variables

```env
MPESA_DARAJA_FORCE_SANDBOX=true
MPESA_ENV=sandbox
MPESA_SHORTCODE=174379
MPESA_PASSKEY=<sandbox passkey from Daraja app>
MPESA_CONSUMER_KEY=<sandbox consumer key>
MPESA_CONSUMER_SECRET=<sandbox consumer secret>
MPESA_CALLBACK_URL=https://mydomain.com/mpesa-express-simulate/
# Optional: always fetch OAuth token (no cache) while debugging 404.001.03
MPESA_DARAJA_BYPASS_TOKEN_CACHE=false
# STK password timestamp (default Kenya local time)
MPESA_STK_TIMESTAMP_TZ=Africa/Nairobi
```

With **`MPESA_DARAJA_FORCE_SANDBOX=true`** (default in settings), both OAuth and STK use **`https://sandbox.safaricom.co.ke`** regardless of `MPESA_ENV`. Set **`MPESA_DARAJA_FORCE_SANDBOX=false`** when switching to live credentials and production host.

## Example sandbox STK fields (from Daraja test app)

| Field | Example |
|-------|---------|
| BusinessShortCode | 174379 |
| PartyA / PhoneNumber | 254708374149 |
| PartyB | 174379 |
| Amount | 1 |
| TransactionType | CustomerPayBillOnline |
| Timestamp | **Live** `YYYYMMDDHHmmss` in `Africa/Nairobi` (not a fixed past value) |
| AccountReference | Test |
| TransactionDesc | Test |
| CallBackURL | `https://…` (HTTPS) |

Do **not** hardcode a historical timestamp (e.g. `20260320203302`) in production code — the STK password must use the **current** time in the configured TZ or Daraja will reject the request.

## Rules enforced in code

- Sandbox **must** use shortcode **174379** with sandbox keys/passkey (same Daraja app).
- Callback URL **must** be **HTTPS**.
- Phone must normalize to **254…** (e.g. `254708374149`).
- STK password: `Base64(BusinessShortCode + PassKey + Timestamp)` with `Timestamp` = `YYYYMMDDHHmmss` in `MPESA_STK_TIMESTAMP_TZ`.
- `get_access_token(force_refresh=True)` invalidates cached OAuth keys before fetching from the same host as STK.
- `MPESA_DARAJA_BYPASS_TOKEN_CACHE=true`: always calls OAuth (no read/write cache) for sandbox debugging.
- On **404.001.03** / invalid access token: cache cleared, new OAuth token, **new** timestamp/password, **one** retry.
- Success: full Daraja JSON returned (`MerchantRequestID`, `CheckoutRequestID`, `ResponseCode`, …).

## Manual OAuth check (curl)

```bash
curl -sS "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic $(printf '%s' 'CONSUMER_KEY:CONSUMER_SECRET' | base64)"
```

Use the `access_token` from the JSON in `Authorization: Bearer …` for STK push.

## STK callback (`POST /api/mpesa/callback/`)

- **CSRF exempt**; **no JWT**; accepts JSON in Daraja shape `Body.stkCallback`.
- Updates row in **`mpesa_stk_payments`** matching `CheckoutRequestID` (`result_code`, `result_desc`, `completed_at`, `merchant_request_id`, …).
- Responds **`200`** with `{"status": "ok", "ResultCode": 0, "ResultDesc": "Accepted"}` even on parse errors (so Daraja does not retry forever).

Set `MPESA_CALLBACK_URL` to your public URL, e.g. `https://xxxx.ngrok-free.app/api/mpesa/callback/`.

Run migrations after pull: `python manage.py migrate`.
