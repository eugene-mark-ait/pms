# Unit application queue for tenant bookings

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("vacancies", "0005_unitnotificationsubscription_user"),
        ("properties", "0007_property_public_listing_fields"),
    ]

    operations = [
        migrations.CreateModel(
            name="UnitApplication",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[("waiting", "Waiting"), ("approved", "Approved"), ("declined", "Declined")], default="waiting", max_length=20)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("applicant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="unit_applications", to=settings.AUTH_USER_MODEL)),
                ("unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="applications", to="properties.unit")),
            ],
            options={
                "db_table": "unit_applications",
                "ordering": ["created_at"],
                "unique_together": {("unit", "applicant")},
            },
        ),
    ]
