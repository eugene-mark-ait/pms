import uuid
from django.db import models
from django.conf import settings
from properties.models import Property, Unit


class Complaint(models.Model):
    """Complaint from tenant to property manager or landlord."""
    class Status(models.TextChoices):
        OPEN = "open", "Open"
        IN_PROGRESS = "in_progress", "In Progress"
        RESOLVED = "resolved", "Resolved"
        CLOSED = "closed", "Closed"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="complaints",
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="complaints",
        null=True,
        blank=True,
    )
    tenant = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="complaints",
    )
    title = models.CharField(max_length=255)
    description = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.OPEN,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "complaints"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.property.name}"
