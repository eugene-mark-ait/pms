# Add optional user FK to UnitNotificationSubscription for tenant-owned alerts

from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vacancies", "0004_unit_notification_subscription"),
    ]

    operations = [
        migrations.AddField(
            model_name="unitnotificationsubscription",
            name="user",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=models.CASCADE,
                related_name="vacancy_notification_subscriptions",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
