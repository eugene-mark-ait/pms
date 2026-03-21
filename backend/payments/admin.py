from django.contrib import admin
from .models import CreditScoreRecord, MpesaStkPayment, Payment, PaymentReceipt, Transaction


@admin.register(MpesaStkPayment)
class MpesaStkPaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "lease",
        "amount",
        "status",
        "checkout_request_id",
        "mpesa_receipt_number",
        "created_at",
    )
    list_filter = ("status", "created_at")
    search_fields = ("checkout_request_id", "phone", "user__email", "mpesa_receipt_number")
    raw_id_fields = ("user", "lease", "payment")
    readonly_fields = ("id", "created_at", "updated_at", "completed_at")


class TransactionInline(admin.TabularInline):
    model = Transaction
    extra = 0
    readonly_fields = ("id", "created_at")


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("lease", "amount", "payment_date", "payment_status", "payment_method", "created_at")
    list_filter = ("payment_status", "payment_method", "payment_date")
    search_fields = ("lease__unit__unit_number", "lease__tenant__email")
    raw_id_fields = ("lease",)
    readonly_fields = ("id", "created_at", "updated_at")
    inlines = [TransactionInline]


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("payment", "amount", "description", "created_at")
    list_filter = ("created_at",)
    search_fields = ("description",)
    raw_id_fields = ("payment",)
    readonly_fields = ("id", "created_at")


@admin.register(PaymentReceipt)
class PaymentReceiptAdmin(admin.ModelAdmin):
    list_display = ("payment", "receipt_number", "created_at")
    search_fields = ("receipt_number",)
    raw_id_fields = ("payment",)
    readonly_fields = ("id", "created_at")


@admin.register(CreditScoreRecord)
class CreditScoreRecordAdmin(admin.ModelAdmin):
    list_display = ("lease", "score", "on_time_payments", "late_payments", "created_at")
    list_filter = ("created_at",)
    search_fields = ("lease__tenant__email", "notes")
    raw_id_fields = ("lease",)
    readonly_fields = ("id", "created_at", "updated_at")
