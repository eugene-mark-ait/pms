from django.contrib import admin
from .models import (
    Property,
    PropertyImage,
    PropertyPayoutSettings,
    Unit,
    UnitImage,
    PropertyRule,
    ManagerAssignment,
    CaretakerAssignment,
)


class PropertyImageInline(admin.TabularInline):
    model = PropertyImage
    extra = 0
    fields = ("image", "caption", "sort_order")


class UnitInline(admin.TabularInline):
    model = Unit
    extra = 0
    fields = ("unit_number", "unit_type", "monthly_rent", "is_vacant")


class UnitImageInline(admin.TabularInline):
    model = UnitImage
    extra = 0
    fields = ("image", "caption", "sort_order")


class PropertyRuleInline(admin.TabularInline):
    model = PropertyRule
    extra = 0
    fields = ("title", "description")


class ManagerAssignmentInline(admin.TabularInline):
    model = ManagerAssignment
    extra = 0
    raw_id_fields = ("manager",)


class CaretakerAssignmentInline(admin.TabularInline):
    model = CaretakerAssignment
    extra = 0
    raw_id_fields = ("caretaker",)


@admin.register(PropertyPayoutSettings)
class PropertyPayoutSettingsAdmin(admin.ModelAdmin):
    list_display = ("property", "method", "phone_number", "till_number", "paybill_number", "updated_at")
    list_filter = ("method",)
    search_fields = ("property__name", "phone_number", "till_number", "paybill_number")
    raw_id_fields = ("property", "updated_by")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ("name", "property_owner", "created_at")
    list_filter = ("created_at",)
    search_fields = ("name", "address", "property_owner__email")
    raw_id_fields = ("property_owner",)
    inlines = [PropertyImageInline, UnitInline, PropertyRuleInline, ManagerAssignmentInline, CaretakerAssignmentInline]
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ("unit_number", "property", "unit_type", "monthly_rent", "is_vacant", "created_at")
    list_filter = ("property", "unit_type", "is_vacant")
    search_fields = ("unit_number", "property__name")
    raw_id_fields = ("property",)
    inlines = [UnitImageInline]
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(PropertyImage)
class PropertyImageAdmin(admin.ModelAdmin):
    list_display = ("property", "caption", "sort_order", "created_at")
    raw_id_fields = ("property",)


@admin.register(UnitImage)
class UnitImageAdmin(admin.ModelAdmin):
    list_display = ("unit", "caption", "sort_order", "created_at")
    raw_id_fields = ("unit",)


@admin.register(PropertyRule)
class PropertyRuleAdmin(admin.ModelAdmin):
    list_display = ("title", "property", "created_at")
    list_filter = ("property",)
    search_fields = ("title", "description", "property__name")
    raw_id_fields = ("property",)
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(ManagerAssignment)
class ManagerAssignmentAdmin(admin.ModelAdmin):
    list_display = ("property", "manager", "assigned_at")
    list_filter = ("property",)
    search_fields = ("property__name", "manager__email")
    raw_id_fields = ("property", "manager")
    readonly_fields = ("id", "assigned_at")


@admin.register(CaretakerAssignment)
class CaretakerAssignmentAdmin(admin.ModelAdmin):
    list_display = ("property", "caretaker", "assigned_at")
    list_filter = ("property",)
    search_fields = ("property__name", "caretaker__email")
    raw_id_fields = ("property", "caretaker")
    readonly_fields = ("id", "assigned_at")
