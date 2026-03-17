# Marketplace Service model

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Service",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=200)),
                ("category", models.CharField(max_length=100)),
                ("description", models.TextField()),
                ("price_range", models.CharField(blank=True, max_length=100)),
                ("service_area", models.CharField(max_length=255)),
                ("availability", models.CharField(blank=True, max_length=255)),
                ("contact_info", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("provider", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="marketplace_services", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "marketplace_services",
                "ordering": ["-created_at"],
            },
        ),
    ]
