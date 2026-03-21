# IntaSend integration (Mahaliwise)

Aligned with official docs:

- [Authentication](https://developers.intasend.com/docs/authentication) — secret key only on backend; SDK uses `token` + `publishable_key`.
- [Client libraries](https://developers.intasend.com/docs/client-libraries) — `pip install intasend-python`, `APIService(..., test=True|False)`.
- [Sandbox vs live](https://developers.intasend.com/docs/api-testing-and-sandbox) — sandbox base `https://sandbox.intasend.com/api/`; use test keys with `INTASEND_TEST_MODE=true`.
- [Errors](https://developers.intasend.com/docs/errors-references) — responses may include `type`, `errors[]` with `code` / `detail`; handled as `IntaSendAPIError`.
- [M-Pesa STK Push](https://developers.intasend.com/docs/m-pesa-stk-push) — tenant checkout uses `collect.mpesa_stk_push` only (no till/paybill in UI).
- [Payment collection webhooks](https://developers.intasend.com/docs/payment-collection-events) — states: `PENDING`, `PROCESSING`, `COMPLETE`, `FAILED`.
- [Webhook setup](https://developers.intasend.com/docs/setup) — HTTPS URL; set `INTASEND_WEBHOOK_CHALLENGE` to match dashboard **challenge**; optional `INTASEND_WEBHOOK_SECRET` for header checks.

**Endpoints**

- `POST /api/payments/intasend/webhook/` — collection events.
- `GET /api/payments/rent-collection/<uuid>/` — poll when webhook is delayed.

**Environment**

See `backend/.env.example`: `INTASEND_PUBLISHABLE_KEY`, `INTASEND_SECRET_KEY`, `INTASEND_TEST_MODE`, `INTASEND_WEBHOOK_CHALLENGE`, `INTASEND_WEBHOOK_SECRET`, `PLATFORM_COMMISSION_RATE`.
