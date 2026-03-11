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
    can_pay_rent = serializers.SerializerMethodField()
    has_active_notice = serializers.SerializerMethodField()
    active_notice_move_out_date = serializers.SerializerMethodField()
    active_notice_id = serializers.SerializerMethodField()

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
            "can_pay_rent",
            "has_active_notice",
            "active_notice_move_out_date",
            "active_notice_id",
            "created_at",
        ]

    def get_can_pay_rent(self, obj):
        """True if rent is due/overdue and current period not yet paid."""
        from .services import get_payment_status, get_next_rent_due_date
        from datetime import date
        status = get_payment_status(obj)
        if status == "paid":
            return False
        next_due = get_next_rent_due_date(obj)
        return next_due <= date.today()

    def get_has_active_notice(self, obj):
        from vacancies.models import VacateNotice
        notice = VacateNotice.objects.filter(lease=obj, notice_cancelled=False).order_by("-created_at").first()
        return notice is not None

    def get_active_notice_move_out_date(self, obj):
        from vacancies.models import VacateNotice
        notice = VacateNotice.objects.filter(lease=obj, notice_cancelled=False).order_by("-created_at").first()
        return notice.move_out_date.isoformat() if notice else None

    def get_active_notice_id(self, obj):
        from vacancies.models import VacateNotice
        notice = VacateNotice.objects.filter(lease=obj, notice_cancelled=False).order_by("-created_at").first()
        return str(notice.id) if notice else None

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
    """Create lease: rent and deposit are always taken from the unit (not editable by landlord)."""
    monthly_rent = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    deposit_amount = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)

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

    def validate(self, attrs):
        unit = attrs.get("unit")
        if unit:
            attrs["monthly_rent"] = unit.monthly_rent
            attrs["deposit_amount"] = getattr(unit, "security_deposit", None) or 0
        return attrs


class GiveNoticeSerializer(serializers.Serializer):
    move_out_date = serializers.DateField()
    reason = serializers.CharField(required=False, allow_blank=True)
    notice_message = serializers.CharField(required=False, allow_blank=True)
