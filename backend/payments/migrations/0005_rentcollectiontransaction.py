# IntaSend rent collection + split (platform / owner).

import uuid

import django.db.models.deletion
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("leases", "0003_add_eviction_notice"),
        ("properties", "0009_propertypayoutsettings"),
        ("payments", "0004_mpesastkpayment_completed_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="RentCollectionTransaction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("tenant_phone", models.CharField(max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("platform_cut", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("owner_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                (
                    "platform_commission_rate",
                    models.DecimalField(
                        decimal_places=4,
                        default=Decimal("0.0300"),
                        help_text="Configurable later; default 3%.",
                        max_digits=5,
                    ),
                ),
                ("months_paid_for", models.PositiveIntegerField()),
                ("deposit_to_add", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                (
                    "status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("collected", "Collected"),
                            ("failed", "Failed"),
                        ],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                (
                    "payout_status",
                    models.CharField(
                        choices=[
                            ("pending", "Pending"),
                            ("processing", "Processing"),
                            ("completed", "Completed"),
                            ("failed", "Failed"),
                            ("manual", "Manual review"),
                        ],
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("intasend_invoice_id", models.CharField(blank=True, db_index=True, max_length=120)),
                ("intasend_api_ref", models.CharField(blank=True, max_length=120)),
                ("intasend_reference", models.CharField(blank=True, max_length=255)),
                ("payout_tracking_id", models.CharField(blank=True, max_length=120)),
                ("payout_error", models.TextField(blank=True)),
                ("failure_reason", models.TextField(blank=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "lease",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rent_collection_transactions",
                        to="leases.lease",
                    ),
                ),
                (
                    "property",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rent_collection_transactions",
                        to="properties.property",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="rent_collection_transactions",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "payment",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="rent_collection",
                        to="payments.payment",
                    ),
                ),
            ],
            options={
                "db_table": "rent_collection_transactions",
                "ordering": ["-created_at"],
            },
        ),
    ]
