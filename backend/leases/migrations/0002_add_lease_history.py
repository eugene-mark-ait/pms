# Generated manually for LeaseHistory model

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("properties", "0005_add_property_is_closed"),
        ("leases", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="LeaseHistory",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("lease_start_date", models.DateField()),
                ("lease_end_date", models.DateField()),
                ("notice_date", models.DateField(blank=True, help_text="When vacate notice was given (created_at of notice).", null=True)),
                ("move_out_date", models.DateField(help_text="When tenant moved out / notice period ended.")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lease_history", to=settings.AUTH_USER_MODEL)),
                ("unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="lease_history", to="properties.unit")),
            ],
            options={
                "db_table": "lease_history",
                "ordering": ["-move_out_date"],
                "verbose_name_plural": "Lease history",
            },
        ),
    ]
