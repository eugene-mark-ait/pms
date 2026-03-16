# UnitNotificationSubscription for vacancy alerts

import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vacancies", "0003_unit_vacancy_info_and_preferred_unit_type"),
    ]

    operations = [
        migrations.CreateModel(
            name="UnitNotificationSubscription",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("email", models.EmailField(max_length=254)),
                ("phone", models.CharField(blank=True, max_length=20)),
                ("search_filters", models.JSONField(default=dict, help_text="Saved filters: unit_type, location, min_rent, max_rent (optional keys).")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={
                "db_table": "unit_notification_subscriptions",
                "ordering": ["-created_at"],
            },
        ),
    ]
