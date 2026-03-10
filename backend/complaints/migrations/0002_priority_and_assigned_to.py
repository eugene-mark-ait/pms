# Add complaint priority and assigned_to

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("complaints", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="complaint",
            name="priority",
            field=models.CharField(
                choices=[("low", "Low"), ("medium", "Medium"), ("high", "High"), ("urgent", "Urgent")],
                default="medium",
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name="complaint",
            name="assigned_to",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="assigned_complaints",
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
