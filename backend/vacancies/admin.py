from django.contrib import admin
from .models import VacateNotice, VacancyListing, TenantVacancyPreference, TenantUnitAlert


@admin.register(VacateNotice)
class VacateNoticeAdmin(admin.ModelAdmin):
    list_display = ("lease", "move_out_date", "reason", "created_at")
    list_filter = ("move_out_date", "created_at")
    search_fields = ("lease__unit__unit_number", "lease__tenant__email", "reason")
    raw_id_fields = ("lease",)
    readonly_fields = ("id", "created_at")


@admin.register(VacancyListing)
class VacancyListingAdmin(admin.ModelAdmin):
    list_display = ("property", "unit", "available_from", "is_filled", "created_at")
    list_filter = ("is_filled", "available_from")
    search_fields = ("property__name", "unit__unit_number")
    raw_id_fields = ("property", "unit", "vacate_notice")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(TenantVacancyPreference)
class TenantVacancyPreferenceAdmin(admin.ModelAdmin):
    list_display = ("user", "is_looking", "preferred_unit_type", "preferred_location", "updated_at")
    list_filter = ("is_looking", "preferred_unit_type")
    search_fields = ("user__email", "preferred_location")
    raw_id_fields = ("user",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(TenantUnitAlert)
class TenantUnitAlertAdmin(admin.ModelAdmin):
    list_display = ("user", "unit_type", "min_rent", "max_rent", "location", "is_active", "created_at")
    list_filter = ("is_active", "unit_type")
    search_fields = ("user__email", "location", "property_name")
    raw_id_fields = ("user",)
    readonly_fields = ("id", "created_at", "updated_at")
