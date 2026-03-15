# Generated for EvictionNotice model

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("leases", "0002_add_lease_history"),
    ]

    operations = [
        migrations.CreateModel(
            name="EvictionNotice",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("reason", models.TextField(help_text="Eviction reason shown to tenant.")),
                ("move_out_deadline", models.DateField(help_text="Date by which tenant must move out.")),
                ("optional_notes", models.TextField(blank=True, default="")),
                ("cancelled", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("lease", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="eviction_notices", to="leases.lease")),
            ],
            options={
                "db_table": "eviction_notices",
                "ordering": ["-created_at"],
            },
        ),
    ]
