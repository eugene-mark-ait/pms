import uuid
from django.db import models
from django.conf import settings


class Notification(models.Model):
    """In-app notification (rent reminders, policy updates, complaint updates)."""
    class NotificationType(models.TextChoices):
        RENT_REMINDER = "rent_reminder", "Rent Reminder"
        POLICY_UPDATE = "policy_update", "Policy Update"
        COMPLAINT_UPDATE = "complaint_update", "Complaint Update"
        VACATE_NOTICE = "vacate_notice", "Vacate Notice"
        PAYMENT_RECEIVED = "payment_received", "Payment Received"
        GENERAL = "general", "General"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="notifications",
    )
    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.GENERAL,
    )
    title = models.CharField(max_length=255)
    body = models.TextField(blank=True)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email}: {self.title}"
