# Property owner payout configuration (IntaSend settlement — not shown to tenants).

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("properties", "0008_rename_landlord_to_property_owner"),
    ]

    operations = [
        migrations.CreateModel(
            name="PropertyPayoutSettings",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                (
                    "method",
                    models.CharField(
                        choices=[
                            ("phone", "M-Pesa phone number"),
                            ("till", "M-Pesa till number"),
                            ("paybill", "M-Pesa paybill"),
                        ],
                        default="phone",
                        max_length=20,
                    ),
                ),
                ("phone_number", models.CharField(blank=True, max_length=20)),
                ("till_number", models.CharField(blank=True, max_length=32)),
                ("paybill_number", models.CharField(blank=True, max_length=32)),
                ("account_number", models.CharField(blank=True, max_length=64)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "property",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payout_settings",
                        to="properties.property",
                    ),
                ),
                (
                    "updated_by",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="updated_payout_settings",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "property_payout_settings",
            },
        ),
    ]
