from datetime import date
from decimal import Decimal
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Payment
from .serializers import PaymentSerializer, PayRentSerializer
from leases.models import Lease
from leases.services import get_next_rent_due_date, get_payment_status, get_last_payment_end
from accounts.permissions import IsTenant
from notifications.models import Notification


def tenant_payments_queryset(user):
    return Payment.objects.filter(lease__tenant=user).select_related("lease", "lease__unit", "lease__unit__property").order_by("-payment_date")


class PayRentView(generics.GenericAPIView):
    """POST /api/payments/pay-rent/ - tenant pays rent for 1–3 months. First payment must include deposit if not paid."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = PayRentSerializer

    def post(self, request):
        serializer = PayRentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        lease_id = data["lease_id"]
        months = data["months"]
        payment_method = data["payment_method"]

        lease = get_object_or_404(
            Lease,
            id=lease_id,
            tenant=request.user,
            is_active=True,
        )

        if months < 1 or months > 3:
            return Response(
                {"error": "Months must be 1, 2, or 3"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        next_due = get_next_rent_due_date(lease)
        today = date.today()
        if next_due > today:
            return Response(
                {"error": "Rent is not yet due. You can pay from the due date."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if get_payment_status(lease) == "paid":
            return Response(
                {"error": "Current period is already paid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        period_start = next_due
        from calendar import monthrange
        end_month = next_due.month + months - 1
        end_year = next_due.year
        while end_month > 12:
            end_month -= 12
            end_year += 1
        _, last_day = monthrange(end_year, end_month)
        period_end = date(end_year, end_month, last_day)

        amount = lease.monthly_rent * months
        deposit_to_add = Decimal("0")
        if not lease.deposit_paid and lease.deposit_amount and lease.deposit_amount > 0:
            last_end = get_last_payment_end(lease)
            if last_end is None:
                deposit_to_add = lease.deposit_amount
        amount += deposit_to_add

        if amount <= 0:
            return Response(
                {"error": "Payment amount must be greater than zero"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        payment = Payment.objects.create(
            lease=lease,
            amount=amount,
            months_paid_for=months,
            period_start=period_start,
            period_end=period_end,
            payment_date=today,
            payment_method=payment_method,
            payment_status=Payment.PaymentStatus.COMPLETED,
        )

        if deposit_to_add > 0:
            lease.deposit_paid = True
            lease.save(update_fields=["deposit_paid", "updated_at"])

        Notification.objects.create(
            user=lease.unit.property.landlord,
            notification_type=Notification.NotificationType.PAYMENT_RECEIVED,
            title="Rent payment received",
            body=f"Tenant paid {amount} for {lease.unit.unit_number} ({months} month(s)).",
        )

        return Response(
            PaymentSerializer(payment).data,
            status=status.HTTP_201_CREATED,
        )


class PaymentHistoryView(generics.ListAPIView):
    """GET /api/payments/history/ - tenant's payment history."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        return tenant_payments_queryset(self.request.user)


class PaymentListView(generics.ListAPIView):
    """GET /api/payments/ - list payments (landlord/manager filter by property/lease)."""
    permission_classes = [IsAuthenticated]
    serializer_class = PaymentSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Payment.objects.select_related("lease", "lease__unit", "lease__unit__property", "lease__tenant").order_by("-payment_date")
        if user.has_role("tenant"):
            return qs.filter(lease__tenant=user)
        if user.has_role("landlord"):
            return qs.filter(lease__unit__property__landlord=user)
        if user.has_role("manager"):
            return qs.filter(lease__unit__property__manager_assignments__manager=user).distinct()
        if user.has_role("caretaker"):
            return qs.filter(lease__unit__property__caretaker_assignments__caretaker=user).distinct()
        return qs.none()


def _payments_queryset_for_user(user):
    qs = Payment.objects.select_related("lease", "lease__unit", "lease__unit__property", "lease__tenant").order_by("-payment_date")
    if user.has_role("tenant"):
        return qs.filter(lease__tenant=user)
    if user.has_role("landlord"):
        return qs.filter(lease__unit__property__landlord=user)
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


class MpesaStkPushView(generics.GenericAPIView):
    """POST /api/payments/mpesa-stk-push/ - initiate M-Pesa STK Push. Requires M-Pesa credentials (consumer key, secret, passkey) in env."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from django.conf import settings
        if not getattr(settings, "MPESA_CONSUMER_KEY", None) or not getattr(settings, "MPESA_CONSUMER_SECRET", None):
            return Response(
                {"error": "M-Pesa STK Push is not configured. Set MPESA_CONSUMER_KEY, MPESA_CONSUMER_SECRET, and MPESA_PASSKEY in environment. See Safaricom Daraja API docs."},
                status=status.HTTP_501_NOT_IMPLEMENTED,
            )
        phone = request.data.get("phone", "").strip().replace("+", "").replace(" ", "")
        amount = request.data.get("amount")
        lease_id = request.data.get("lease_id")
        if not phone or not amount or not lease_id:
            return Response(
                {"error": "phone, amount, and lease_id are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(
            {"error": "M-Pesa STK Push integration requires implementing Safaricom Daraja API (STK push). Use a library such as django-mpesa or call the API directly with your credentials."},
            status=status.HTTP_501_NOT_IMPLEMENTED,
        )
