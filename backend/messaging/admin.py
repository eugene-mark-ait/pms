from django.contrib import admin
from .models import Message


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("sender", "recipient", "property", "read_at", "created_at")
    list_filter = ("read_at", "created_at")
    search_fields = ("body", "sender__email", "recipient__email")
    raw_id_fields = ("property", "sender", "recipient")
    readonly_fields = ("id", "created_at")
