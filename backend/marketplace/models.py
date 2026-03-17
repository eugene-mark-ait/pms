import uuid
from django.db import models
from django.conf import settings
from django.db.models import Avg, Q


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
    min_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Minimum price (e.g. KSh).",
    )
    max_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Maximum price (e.g. KSh).",
    )
    service_area = models.CharField(max_length=255)
    availability = models.CharField(max_length=255, blank=True)
    contact_info = models.CharField(max_length=255, blank=True)
    # Optional image: stored in MEDIA_ROOT or S3 (e.g. marketplace/service/<uuid>.jpg)
    image = models.ImageField(upload_to="marketplace/services/", blank=True, null=True, max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "marketplace_services"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} ({self.provider.email})"

    def average_rating(self):
        agg = ServiceReview.objects.filter(service=self).aggregate(a=Avg("rating"))
        return round(agg["a"] or 0, 1)

    def review_count(self):
        return ServiceReview.objects.filter(service=self).count()


class ServiceReview(models.Model):
    """User review/rating for a service (1-5 stars, optional text)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_reviews_given",
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_reviews_received",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="reviews",
        null=True,
        blank=True,
    )
    rating = models.PositiveSmallIntegerField()  # 1-5
    review = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "service_reviews"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "service"],
                condition=Q(service__isnull=False),
                name="unique_user_service_review",
            ),
        ]

    def __str__(self):
        return f"{self.user.email} -> {self.service_id} ({self.rating})"


class ServiceRequest(models.Model):
    """User request for a service; provider can mark as actioned; user can cancel if pending."""
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        ACTIONED = "actioned", "Actioned"
        CANCELLED = "cancelled", "Cancelled"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_requests_made",
    )
    provider = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="marketplace_requests_received",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name="requests",
    )
    message = models.TextField()
    preferred_date = models.DateField(null=True, blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "service_requests"
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.email} -> {self.service.title} ({self.status})"
