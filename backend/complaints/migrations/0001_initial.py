# Initial Complaint model (without priority, assigned_to)

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("properties", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Complaint",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField()),
                ("status", models.CharField(choices=[("open", "Open"), ("in_progress", "In Progress"), ("resolved", "Resolved"), ("closed", "Closed")], default="open", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("resolved_at", models.DateTimeField(blank=True, null=True)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="complaints", to="properties.property")),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="complaints", to=settings.AUTH_USER_MODEL)),
                ("unit", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name="complaints", to="properties.unit")),
            ],
            options={
                "db_table": "complaints",
                "ordering": ["-created_at"],
            },
        ),
    ]
