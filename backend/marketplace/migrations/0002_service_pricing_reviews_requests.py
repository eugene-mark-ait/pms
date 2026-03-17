# Service min/max price, ServiceReview, ServiceRequest

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("marketplace", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="min_price",
            field=models.DecimalField(blank=True, decimal_places=2, help_text="Minimum price (e.g. KSh).", max_digits=12, null=True),
        ),
        migrations.AddField(
            model_name="service",
            name="max_price",
            field=models.DecimalField(blank=True, decimal_places=2, help_text="Maximum price (e.g. KSh).", max_digits=12, null=True),
        ),
        migrations.CreateModel(
            name="ServiceReview",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("rating", models.PositiveSmallIntegerField()),
                ("review", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("provider", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_reviews_received", to=settings.AUTH_USER_MODEL)),
                ("service", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="reviews", to="marketplace.service")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_reviews_given", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "service_reviews",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="ServiceRequest",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("message", models.TextField()),
                ("preferred_date", models.DateField(blank=True, null=True)),
                ("status", models.CharField(choices=[("pending", "Pending"), ("actioned", "Actioned")], default="pending", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("provider", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_requests_received", to=settings.AUTH_USER_MODEL)),
                ("service", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="requests", to="marketplace.service")),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_requests_made", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "service_requests",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddConstraint(
            model_name="servicereview",
            constraint=models.UniqueConstraint(condition=models.Q(("service__isnull", False)), fields=("user", "service"), name="unique_user_service_review"),
        ),
    ]
