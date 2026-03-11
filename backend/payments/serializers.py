from rest_framework import serializers
from .models import Payment, PaymentReceipt
from leases.serializers import LeaseSerializer


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
