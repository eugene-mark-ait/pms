from rest_framework import serializers
from .models import Lease, TenantProfile
from .services import (
    get_next_rent_due_date,
    get_outstanding_balance,
    get_payment_status,
    get_last_payment_end,
)
from properties.serializers import UnitSerializer
from accounts.serializers import UserSerializer


class UnitWithPropertySerializer(serializers.Serializer):
    id = serializers.UUIDField(read_only=True)
    unit_number = serializers.CharField()
    property = serializers.SerializerMethodField()

    def get_property(self, obj):
        return {"id": str(obj.property_id), "name": obj.property.name}


class LeaseSerializer(serializers.ModelSerializer):
    unit = UnitWithPropertySerializer(read_only=True)
    tenant = UserSerializer(read_only=True)
    next_rent_due = serializers.SerializerMethodField()
    outstanding_balance = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    last_payment_date = serializers.SerializerMethodField()

    class Meta:
        model = Lease
        fields = [
            "id",
            "unit",
            "tenant",
            "monthly_rent",
            "deposit_amount",
            "deposit_paid",
            "start_date",
            "end_date",
            "is_active",
            "next_rent_due",
            "outstanding_balance",
            "payment_status",
            "last_payment_date",
            "created_at",
        ]

    def get_next_rent_due(self, obj):
        return get_next_rent_due_date(obj)

    def get_outstanding_balance(self, obj):
        return get_outstanding_balance(obj)

    def get_payment_status(self, obj):
        return get_payment_status(obj)

    def get_last_payment_date(self, obj):
        end = get_last_payment_end(obj)
        if end:
            from payments.models import Payment
            p = (
                Payment.objects.filter(
                    lease=obj,
                    payment_status=Payment.PaymentStatus.COMPLETED,
                )
                .order_by("-period_end")
                .first()
            )
            return p.payment_date if p else end
        return None


class LeaseCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lease
        fields = [
            "id",
            "unit",
            "tenant",
            "monthly_rent",
            "deposit_amount",
            "deposit_paid",
            "start_date",
            "end_date",
            "is_active",
        ]


class GiveNoticeSerializer(serializers.Serializer):
    move_out_date = serializers.DateField()
    reason = serializers.CharField(required=False, allow_blank=True)
    notice_message = serializers.CharField(required=False, allow_blank=True)
