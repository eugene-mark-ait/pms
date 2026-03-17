from django.contrib import admin
from .models import Service


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "provider", "service_area", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "description", "service_area", "provider__email")
    raw_id_fields = ("provider",)
