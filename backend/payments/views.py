from datetime import date
from decimal import Decimal
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Payment
from .serializers import PaymentSerializer, PayRentSerializer
from leases.models import Lease
from leases.services import get_next_rent_due_date
from accounts.permissions import IsTenant
from notifications.models import Notification


def tenant_payments_queryset(user):
    return Payment.objects.filter(lease__tenant=user).select_related("lease", "lease__unit", "lease__unit__property").order_by("-payment_date")


class PayRentView(generics.GenericAPIView):
    """POST /api/payments/pay-rent/ - tenant pays rent for 1–3 months."""
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
        period_start = next_due
        # period_end = last day of the last month we're paying for
        from calendar import monthrange
        end_month = next_due.month + months - 1
        end_year = next_due.year
        while end_month > 12:
            end_month -= 12
            end_year += 1
        _, last_day = monthrange(end_year, end_month)
        period_end = date(end_year, end_month, last_day)

        amount = lease.monthly_rent * months
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
            payment_date=date.today(),
            payment_method=payment_method,
            payment_status=Payment.PaymentStatus.COMPLETED,
        )

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
        return qs.none()
