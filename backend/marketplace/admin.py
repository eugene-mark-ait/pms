from django.contrib import admin
from .models import Service, ServiceReview, ServiceRequest


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "provider", "min_price", "max_price", "service_area", "created_at")
    list_filter = ("category", "created_at")
    search_fields = ("title", "description", "service_area", "provider__email")
    raw_id_fields = ("provider",)


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "service", "rating", "created_at")
    list_filter = ("rating", "created_at")
    search_fields = ("user__email", "review")
    raw_id_fields = ("user", "provider", "service")


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "service", "status", "created_at")
    list_filter = ("status", "created_at")
    search_fields = ("user__email", "message")
    raw_id_fields = ("user", "provider", "service")
