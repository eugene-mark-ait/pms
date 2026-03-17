# TenantUnitAlert: saved search alerts for tenants

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("vacancies", "0007_rename_show_landlord_phone_to_property_owner"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantUnitAlert",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("unit_type", models.CharField(blank=True, max_length=32)),
                ("min_rent", models.DecimalField(blank=True, decimal_places=2, help_text="Minimum monthly rent (optional).", max_digits=12, null=True)),
                ("max_rent", models.DecimalField(blank=True, decimal_places=2, help_text="Maximum monthly rent (optional).", max_digits=12, null=True)),
                ("location", models.CharField(blank=True, max_length=255)),
                ("property_name", models.CharField(blank=True, max_length=255)),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tenant_unit_alerts", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "tenant_alerts",
                "ordering": ["-created_at"],
            },
        ),
    ]
