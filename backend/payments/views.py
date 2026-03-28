import json
import logging
from decimal import Decimal

from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsTenant

from .daraja import stk_amount_kes, stk_push
from .models import FlutterwaveRentCharge, MpesaStkPayment, Payment
from .rent_service import compute_pay_rent_totals, create_completed_rent_payment, get_lease_for_tenant
from .serializers import (
    FlutterwaveRentChargeStatusSerializer,
    MpesaStkStatusSerializer,
    PayRentStkSerializer,
    PaymentSerializer,
)
from .flutterwave.oauth import flutterwave_configured
from .flutterwave.rent_flow import handle_webhook_payload, initiate_rent_payment_flutterwave, sync_flutterwave_rent_charge_from_api
from .flutterwave.webhook_verify import verify_flutterwave_signature

logger = logging.getLogger(__name__)

MPESA_RESULT_HINTS = {
    0: "Payment completed successfully.",
    1: "Insufficient balance.",
    1032: "You cancelled the M-PESA prompt.",
    1037: "The request timed out. Please try again.",
    2001: "Wrong PIN entered.",
}


def _parse_mpesa_callback_body(request) -> dict:
    """
    Parse JSON from raw body first (Daraja/ngrok), then DRF request.data.
    With parser_classes=[], DRF may not populate .data — body is authoritative.
    """
    raw = getattr(request, "body", b"") or b""
    if raw.strip():
        try:
            parsed = json.loads(raw.decode("utf-8"))
            if isinstance(parsed, dict):
                return parsed
        except (UnicodeDecodeError, json.JSONDecodeError, TypeError, ValueError) as e:
            logger.warning(
                "M-PESA callback: could not parse JSON body (%s); len=%s prefix=%r",
                e,
                len(raw),
                raw[:200],
            )
    data = getattr(request, "data", None)
    if isinstance(data, dict) and data:
        return data
    return {}


def _extract_stk_callback(payload: dict) -> dict | None:
    """Daraja nests STK result under Body.stkCallback (case variants)."""
    body = payload.get("Body")
    if body is None:
        body = payload.get("body")
    if not isinstance(body, dict):
        return None
    cb = body.get("stkCallback")
    if cb is None:
        cb = body.get("stkcallback") or body.get("StkCallback")
    return cb if isinstance(cb, dict) else None


def _coerce_mpesa_result_code(value) -> int:
    if value is None:
        return -1
    try:
        return int(value)
    except (TypeError, ValueError):
        return -1


def user_friendly_mpesa_message(code: int | None, desc: str = "") -> str:
    if code is None:
        return desc or "Payment could not be completed."
    return MPESA_RESULT_HINTS.get(code, desc or f"Payment failed (code {code}).")


def tenant_payments_queryset(user):
    return Payment.objects.filter(lease__tenant=user).select_related("lease", "lease__unit", "lease__unit__property").order_by("-payment_date")


class PayRentStkInitiateView(APIView):
    """
    POST /api/pay-rent/ and POST /api/payments/pay-rent/
    When Flutterwave OAuth is configured, initiates M-Pesa via Flutterwave (split payout).
    Otherwise uses Safaricom Daraja STK; payment completes only after provider callback/webhook.
    """

    permission_classes = [IsAuthenticated, IsTenant]

    def post(self, request):
        serializer = PayRentStkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        if flutterwave_configured():
            lease = get_lease_for_tenant(data["lease_id"], request.user)
            totals = compute_pay_rent_totals(lease, data["months"])
            if "error" in totals:
                return Response({"error": totals["error"]}, status=status.HTTP_400_BAD_REQUEST)
            amount: Decimal = totals["amount"]
            client_amount: Decimal = data["amount"]
            if amount != client_amount:
                return Response(
                    {"error": "Amount does not match expected rent total. Refresh and try again."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                out = initiate_rent_payment_flutterwave(
                    user=request.user,
                    lease_id=data["lease_id"],
                    months=data["months"],
                    payer_phone=data["phone"],
                    amount=amount,
                )
            except ValueError as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            except RuntimeError as e:
                return Response({"error": str(e)}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
            except Exception:
                logger.exception("Flutterwave rent initiate failed")
                return Response(
                    {"error": "Could not start payment with Flutterwave. Try again later."},
                    status=status.HTTP_502_BAD_GATEWAY,
                )
            return Response(out, status=status.HTTP_201_CREATED)

        if not getattr(settings, "MPESA_CONSUMER_KEY", None) or not getattr(
            settings, "MPESA_CONSUMER_SECRET", None
        ):
            return Response(
                {
                    "error": "M-PESA is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, "
                    "MPESA_PASSKEY, and MPESA_CALLBACK_URL in the server environment."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not (getattr(settings, "MPESA_PASSKEY", None) or "").strip():
            return Response(
                {"error": "MPESA_PASSKEY is not configured."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        callback_url = (getattr(settings, "MPESA_CALLBACK_URL", None) or "").strip()
        if not callback_url:
            return Response(
                {
                    "error": "MPESA_CALLBACK_URL must be a public HTTPS URL reachable by Safaricom "
                    "(e.g. ngrok in development)."
                },
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        lease = get_lease_for_tenant(data["lease_id"], request.user)
        totals = compute_pay_rent_totals(lease, data["months"])
        if "error" in totals:
            return Response({"error": totals["error"]}, status=status.HTTP_400_BAD_REQUEST)

        amount: Decimal = totals["amount"]
        client_amount: Decimal = data["amount"]
        if amount != client_amount:
            return Response(
                {"error": "Amount does not match expected rent total. Refresh and try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        phone = data["phone"]
        kes = stk_amount_kes(amount)
        if kes < 1:
            return Response(
                {"error": "Amount must be at least 1 KES."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            resp = stk_push(
                phone=phone,
                amount=kes,
                account_reference="RENT",
                transaction_desc="Rent Payment",
                callback_url=callback_url,
            )
        except RuntimeError as e:
            logger.warning("STK RuntimeError: %s", e)
            return Response({"error": str(e)}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception:
            logger.exception("STK push failed")
            return Response(
                {"error": "Could not reach M-PESA. Try again later."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        rc = str(resp.get("ResponseCode", ""))
        checkout = (resp.get("CheckoutRequestID") or "").strip()
        merchant = (resp.get("MerchantRequestID") or "").strip()
        if rc != "0" or not checkout:
            msg = resp.get("CustomerMessage") or resp.get("ResponseDescription") or "STK request rejected."
            return Response(
                {"error": msg, "daraja": resp},
                status=status.HTTP_400_BAD_REQUEST,
            )

        stk = MpesaStkPayment.objects.create(
            user=request.user,
            lease=lease,
            months_paid_for=data["months"],
            phone=phone,
            amount=amount,
            deposit_to_add=totals["deposit_to_add"],
            period_start=totals["period_start"],
            period_end=totals["period_end"],
            status=MpesaStkPayment.Status.PENDING,
            checkout_request_id=checkout,
            merchant_request_id=merchant,
        )

        return Response(
            {
                "provider": "daraja",
                "id": str(stk.id),
                "checkout_request_id": checkout,
                "status": "pending",
                "message": "Waiting for M-PESA prompt. Please enter your PIN on your phone.",
            },
            status=status.HTTP_201_CREATED,
        )


class MpesaStkStatusView(APIView):
    """GET /api/payments/mpesa-stk/<id>/ — poll STK payment status (tenant must own the record)."""

    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request, pk):
        stk = get_object_or_404(MpesaStkPayment, pk=pk, user=request.user)
        data = MpesaStkStatusSerializer(stk).data
        if stk.status == MpesaStkPayment.Status.PENDING:
            data["user_message"] = "Waiting for M-PESA. Complete the prompt on your phone."
        elif stk.status == MpesaStkPayment.Status.SUCCESS:
            data["user_message"] = user_friendly_mpesa_message(0, stk.result_desc or "")
        else:
            data["user_message"] = user_friendly_mpesa_message(stk.result_code, stk.result_desc or "")
        return Response(data)


class FlutterwaveRentChargeStatusView(APIView):
    """GET /api/payments/flutterwave-rent/<id>/ — poll Flutterwave rent charge (tenant must own the record)."""

    permission_classes = [IsAuthenticated, IsTenant]

    def get(self, request, pk):
        ch = get_object_or_404(FlutterwaveRentCharge, pk=pk, user=request.user)
        ch = sync_flutterwave_rent_charge_from_api(ch)
        data = FlutterwaveRentChargeStatusSerializer(ch).data
        if ch.status == FlutterwaveRentCharge.Status.PENDING:
            data["user_message"] = "Waiting for M-PESA. Approve the prompt on your phone."
        elif ch.status == FlutterwaveRentCharge.Status.SUCCESS:
            data["user_message"] = "Payment completed successfully."
        else:
            data["user_message"] = (ch.result_message or "").strip() or "Payment failed or was cancelled."
        return Response(data)


@method_decorator(csrf_exempt, name="dispatch")
class FlutterwaveWebhookView(APIView):
    """
    POST /api/flutterwave/webhook/ — Flutterwave events (verify flutterwave-signature).
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    parser_classes = []

    def post(self, request):
        raw = getattr(request, "body", b"") or b""
        secret = (getattr(settings, "FLUTTERWAVE_SECRET_HASH", None) or "").strip()
        sig = request.headers.get("flutterwave-signature") or request.headers.get("Flutterwave-Signature")
        if secret:
            if not verify_flutterwave_signature(raw, sig, secret):
                logger.warning("Flutterwave webhook: invalid signature")
                return Response({"detail": "Invalid signature"}, status=status.HTTP_401_UNAUTHORIZED)
        else:
            logger.warning("FLUTTERWAVE_SECRET_HASH not set; webhook signature not verified")

        try:
            payload = json.loads(raw.decode("utf-8")) if raw.strip() else {}
        except (UnicodeDecodeError, json.JSONDecodeError):
            return Response({"detail": "Invalid JSON"}, status=status.HTTP_400_BAD_REQUEST)
        if not isinstance(payload, dict):
            return Response(status=status.HTTP_400_BAD_REQUEST)

        try:
            handle_webhook_payload(payload)
        except Exception:
            logger.exception("Flutterwave webhook processing failed")

        return Response(status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class MpesaCallbackView(APIView):
    """
    POST /api/mpesa/callback/ — Daraja STK callback (no auth, CSRF exempt).
    Parses Body.stkCallback, updates mpesa_stk_payments (CheckoutRequestID match).
    Always HTTP 200 + JSON so Safaricom does not retry; use status field for app logic.
    """

    permission_classes = [AllowAny]
    authentication_classes = []
    # Empty parsers: avoid DRF 400/415 when Content-Type is not exactly application/json (ngrok/Daraja).
    # We parse request.body in _parse_mpesa_callback_body().
    parser_classes = []

    def post(self, request):
        try:
            return self._process_callback(request)
        except Exception:
            logger.exception("M-PESA callback: unhandled error (returning 200 to avoid Daraja retries)")
            return Response(
                {"status": "ok", "ResultCode": 0, "ResultDesc": "Accepted"},
                status=status.HTTP_200_OK,
            )

    def _ok(self, **extra):
        body = {"status": "ok", "ResultCode": 0, "ResultDesc": "Accepted"}
        body.update(extra)
        return Response(body, status=status.HTTP_200_OK)

    def _process_callback(self, request):
        payload = _parse_mpesa_callback_body(request)
        stk_cb = _extract_stk_callback(payload) or {}

        if not stk_cb:
            logger.info(
                "M-PESA callback: no Body.stkCallback in payload (keys=%s)",
                list(payload.keys()) if isinstance(payload, dict) else type(payload),
            )
            return self._ok()

        checkout_id = (stk_cb.get("CheckoutRequestID") or "").strip()
        merchant_id = (stk_cb.get("MerchantRequestID") or "").strip()[:80]
        result_code = stk_cb.get("ResultCode")
        result_desc = (stk_cb.get("ResultDesc") or "")[:2000]

        if not checkout_id:
            logger.warning("M-PESA callback: stkCallback missing CheckoutRequestID raw=%r", stk_cb)
            return self._ok()

        stk = MpesaStkPayment.objects.filter(checkout_request_id=checkout_id).first()
        if not stk:
            logger.warning("M-PESA callback: unknown CheckoutRequestID=%s", checkout_id)
            return self._ok()

        if stk.status == MpesaStkPayment.Status.SUCCESS:
            return self._ok()

        now = timezone.now()
        rc = _coerce_mpesa_result_code(result_code)
        stk.result_code = rc
        stk.result_desc = result_desc
        stk.completed_at = now
        if merchant_id:
            stk.merchant_request_id = merchant_id

        if rc == 0:
            meta = stk_cb.get("CallbackMetadata") or {}
            items = meta.get("Item") or []
            parsed = {}
            for it in items:
                if isinstance(it, dict) and it.get("Name"):
                    parsed[it["Name"]] = it.get("Value")
            receipt = str(parsed.get("MpesaReceiptNumber") or "")[:80]
            stk.mpesa_receipt_number = receipt
            stk.status = MpesaStkPayment.Status.SUCCESS
            stk.save(
                update_fields=[
                    "result_code",
                    "result_desc",
                    "mpesa_receipt_number",
                    "merchant_request_id",
                    "status",
                    "completed_at",
                    "updated_at",
                ]
            )
            try:
                pay = create_completed_rent_payment(
                    lease=stk.lease,
                    months=stk.months_paid_for,
                    amount=stk.amount,
                    deposit_to_add=stk.deposit_to_add,
                    period_start=stk.period_start,
                    period_end=stk.period_end,
                    transaction_reference=receipt or checkout_id,
                )
                stk.payment = pay
                stk.save(update_fields=["payment", "updated_at"])
            except Exception:
                logger.exception("Failed to create Payment after STK success id=%s", stk.id)
                stk.status = MpesaStkPayment.Status.FAILED
                stk.result_desc = (stk.result_desc or "") + " | Internal error recording payment."
                stk.save(
                    update_fields=["status", "result_desc", "updated_at"],
                )
        else:
            stk.status = MpesaStkPayment.Status.FAILED
            stk.save(
                update_fields=[
                    "result_code",
                    "result_desc",
                    "merchant_request_id",
                    "status",
                    "completed_at",
                    "updated_at",
                ]
            )

        return self._ok()


class PaymentHistoryView(generics.ListAPIView):
    """GET /api/payments/history/ - tenant's payment history."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return tenant_payments_queryset(self.request.user)


class PaymentListView(generics.ListAPIView):
    """GET /api/payments/ - list payments (property owner/manager filter by property/lease)."""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related("lease", "lease__unit", "lease__unit__property", "lease__tenant").order_by("-payment_date")
        if user.has_role("tenant"):
            return qs.filter(lease__tenant=user)
        if user.has_role("property_owner"):
            return qs.filter(lease__unit__property__property_owner=user)
        if user.has_role("manager"):
            return qs.filter(lease__unit__property__manager_assignments__manager=user).distinct()
        if user.has_role("caretaker"):
            return qs.filter(lease__unit__property__caretaker_assignments__caretaker=user).distinct()
        return qs.none()


def _payments_queryset_for_user(user):
    qs = Payment.objects.select_related("lease", "lease__unit", "lease__unit__property", "lease__tenant").order_by("-payment_date")
    if user.has_role("tenant"):
        return qs.filter(lease__tenant=user)
    if user.has_role("property_owner"):
        return qs.filter(lease__unit__property__property_owner=user)
    if user.has_role("manager"):
        return qs.filter(lease__unit__property__manager_assignments__manager=user).distinct()
    if user.has_role("caretaker"):
        return qs.filter(lease__unit__property__caretaker_assignments__caretaker=user).distinct()
    return qs.none()


class PaymentExportView(generics.GenericAPIView):
    """GET /api/payments/export/?format=csv|pdf - export payments as CSV or PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.http import HttpResponse
        from django.utils import timezone
        fmt = (request.query_params.get("format") or "csv").lower()
        qs = _payments_queryset_for_user(request.user)
        if not qs.exists():
            return HttpResponse("No payments to export.", status=404)
        if fmt == "csv":
            response = HttpResponse(content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="payments-{timezone.now().strftime("%Y%m%d")}.csv"'
            import csv
            writer = csv.writer(response)
            writer.writerow([
                "Tenant Name", "Unit", "Property", "Amount", "Payment Date",
                "Payment Method", "Transaction Reference", "Status",
            ])
            for p in qs:
                tenant = p.lease.tenant
                tenant_name = f"{tenant.first_name or ''} {tenant.last_name or ''}".strip() or tenant.email
                writer.writerow([
                    tenant_name,
                    p.lease.unit.unit_number,
                    p.lease.unit.property.name,
                    str(p.amount),
                    p.payment_date.isoformat(),
                    p.get_payment_method_display(),
                    p.transaction_reference or "",
                    p.payment_status,
                ])
            return response
        if fmt == "pdf":
            from reportlab.lib import colors
            from reportlab.lib.pagesizes import A4
            from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
            from reportlab.lib.styles import getSampleStyleSheet
            from io import BytesIO
            try:
                buf = BytesIO()
                doc = SimpleDocTemplate(buf, pagesize=A4)
                styles = getSampleStyleSheet()
                elements = [Paragraph("Payment Export", styles["Title"]), Spacer(1, 12)]
                data = [["Tenant", "Unit", "Property", "Amount", "Date", "Method", "Ref"]]
                for p in qs[:500]:
                    tenant = p.lease.tenant
                    name = f"{tenant.first_name or ''} {tenant.last_name or ''}".strip() or tenant.email
                    data.append([
                        name[:20], p.lease.unit.unit_number, p.lease.unit.property.name[:15],
                        str(p.amount), p.payment_date.isoformat(), p.get_payment_method_display()[:8],
                        (p.transaction_reference or "")[:12],
                    ])
                t = Table(data)
                t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), colors.grey), ("FONTSIZE", (0, 0), (-1, -1), 8)]))
                elements.append(t)
                doc.build(elements)
                response = HttpResponse(buf.getvalue(), content_type="application/pdf")
                response["Content-Disposition"] = f'attachment; filename="payments-{timezone.now().strftime("%Y%m%d")}.pdf"'
                return response
            except ImportError:
                return HttpResponse("PDF export requires reportlab. Install with: pip install reportlab", status=501)
        return HttpResponse("Use format=csv or format=pdf", status=400)
