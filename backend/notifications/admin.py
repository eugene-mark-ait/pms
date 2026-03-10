from django.contrib import admin
from .models import Notification


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "notification_type", "title", "read_at", "created_at")
    list_filter = ("notification_type", "read_at", "created_at")
    search_fields = ("title", "body", "user__email")
    raw_id_fields = ("user",)
    readonly_fields = ("id", "created_at")
