import re

from rest_framework import serializers
from .models import Payment, PaymentReceipt, MpesaStkPayment, FlutterwaveRentCharge
from leases.serializers import LeaseSerializer

MPESA_PHONE_RE = re.compile(r"^254[17]\d{8}$")


class PaymentSerializer(serializers.ModelSerializer):
    lease = LeaseSerializer(read_only=True)

    class Meta:
        model = Payment
        fields = [
            "id",
            "lease",
            "amount",
            "months_paid_for",
            "period_start",
            "period_end",
            "payment_date",
            "payment_method",
            "payment_status",
            "transaction_reference",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]


class PayRentSerializer(serializers.Serializer):
    lease_id = serializers.UUIDField()
    months = serializers.IntegerField(min_value=1, max_value=3)
    payment_method = serializers.ChoiceField(
        choices=Payment.PaymentMethod.choices,
        default=Payment.PaymentMethod.MPESA,
    )


class PayRentStkSerializer(serializers.Serializer):
    """POST /api/pay-rent — initiate M-PESA STK for rent (amount must match server calculation)."""

    lease_id = serializers.UUIDField()
    months = serializers.IntegerField(min_value=1, max_value=3)
    phone = serializers.CharField(max_length=20)
    amount = serializers.DecimalField(max_digits=12, decimal_places=2, min_value=0)

    def validate_phone(self, value):
        p = value.strip().replace("+", "").replace(" ", "").replace("-", "")
        if p.startswith("0") and len(p) == 10:
            p = "254" + p[1:]
        if len(p) == 9 and p.startswith("7"):
            p = "254" + p
        if not MPESA_PHONE_RE.match(p):
            raise serializers.ValidationError(
                "Enter a valid M-PESA number in format 2547XXXXXXXX or 2541XXXXXXXX."
            )
        return p


class MpesaStkStatusSerializer(serializers.ModelSerializer):
    payment_id = serializers.SerializerMethodField()

    class Meta:
        model = MpesaStkPayment
        fields = [
            "id",
            "status",
            "amount",
            "result_code",
            "result_desc",
            "mpesa_receipt_number",
            "checkout_request_id",
            "payment_id",
            "created_at",
            "updated_at",
            "completed_at",
        ]
        read_only_fields = fields

    def get_payment_id(self, obj: MpesaStkPayment):
        return str(obj.payment_id) if obj.payment_id else None


class FlutterwaveRentChargeStatusSerializer(serializers.ModelSerializer):
    payment_id = serializers.SerializerMethodField()

    class Meta:
        model = FlutterwaveRentCharge
        fields = [
            "id",
            "status",
            "amount",
            "tx_ref",
            "flw_ref",
            "result_message",
            "payment_id",
            "created_at",
            "updated_at",
            "completed_at",
        ]
        read_only_fields = fields

    def get_payment_id(self, obj: FlutterwaveRentCharge):
        return str(obj.payment_id) if obj.payment_id else None
