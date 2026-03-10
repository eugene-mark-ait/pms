from django.contrib import admin
from .models import Complaint


@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ("title", "property", "unit", "tenant", "assigned_to", "status", "priority", "created_at")
    list_filter = ("status", "priority", "created_at")
    search_fields = ("title", "description", "property__name", "tenant__email")
    raw_id_fields = ("property", "unit", "tenant", "assigned_to")
    readonly_fields = ("id", "created_at", "updated_at")
