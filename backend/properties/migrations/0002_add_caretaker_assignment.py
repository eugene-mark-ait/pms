# Generated manually for CaretakerAssignment model

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("properties", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="CaretakerAssignment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("assigned_at", models.DateTimeField(auto_now_add=True)),
                ("caretaker", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="caretaker_properties", to=settings.AUTH_USER_MODEL)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="caretaker_assignments", to="properties.property")),
            ],
            options={
                "db_table": "caretaker_assignments",
                "unique_together": {("property", "caretaker")},
            },
        ),
    ]
