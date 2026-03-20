# Daraja sandbox STK (Lipa Na M-PESA Online)

## Environment variables

```env
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

Both OAuth and STK use **`https://sandbox.safaricom.co.ke`** when `MPESA_ENV=sandbox`.

## Rules enforced in code

- Sandbox **must** use shortcode **174379** with sandbox keys/passkey.
- Callback URL **must** be **HTTPS**.
- Phone must normalize to **254…** (e.g. `254708374149`).
- STK password: `Base64(BusinessShortCode + PassKey + Timestamp)` with `Timestamp` = `YYYYMMDDHHmmss` in `MPESA_STK_TIMESTAMP_TZ`.
- On **404.001.03** / invalid access token: cache cleared, new OAuth token, **new** timestamp/password, **one** retry.

## Manual OAuth check (curl)

```bash
curl -sS "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials" \
  -H "Authorization: Basic $(printf '%s' 'CONSUMER_KEY:CONSUMER_SECRET' | base64)"
```

Use the `access_token` from the JSON in `Authorization: Bearer …` for STK push.
