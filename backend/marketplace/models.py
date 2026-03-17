import uuid
from django.db import models
from django.conf import settings


class Service(models.Model):
    """A service offered by a service provider (plumber, electrician, etc.)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_services",
    )
    title = models.CharField(max_length=200)
    category = models.CharField(max_length=100)
    description = models.TextField()
    price_range = models.CharField(max_length=100, blank=True)
    service_area = models.CharField(max_length=255)
    availability = models.CharField(max_length=255, blank=True)
    contact_info = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "marketplace_services"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.provider.email})"
