from django.contrib import admin
from .models import TenantProfile, Lease


@admin.register(TenantProfile)
class TenantProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "created_at", "updated_at")
    search_fields = ("user__email",)
    raw_id_fields = ("user",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Lease)
class LeaseAdmin(admin.ModelAdmin):
    list_display = ("unit", "tenant", "monthly_rent", "start_date", "end_date", "is_active", "created_at")
    list_filter = ("is_active", "start_date", "end_date")
    search_fields = ("unit__unit_number", "tenant__email", "unit__property__name")
    raw_id_fields = ("unit", "tenant")
    readonly_fields = ("id", "created_at", "updated_at")
