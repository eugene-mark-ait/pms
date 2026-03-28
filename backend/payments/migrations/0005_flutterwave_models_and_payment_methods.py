# Flutterwave subaccount map, rent charges, payment method choice update

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("leases", "0001_initial"),
        ("payments", "0004_mpesastkpayment_completed_at"),
    ]

    operations = [
        migrations.CreateModel(
            name="FlutterwaveSubaccount",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("phone_normalized", models.CharField(db_index=True, max_length=15, unique=True)),
                ("subaccount_id", models.CharField(max_length=80)),
                (
                    "is_stale",
                    models.BooleanField(
                        default=False,
                        help_text="True when no property currently uses this phone for payouts.",
                    ),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={
                "db_table": "flutterwave_subaccounts",
            },
        ),
        migrations.CreateModel(
            name="FlutterwaveRentCharge",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("months_paid_for", models.PositiveIntegerField()),
                ("phone", models.CharField(max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("deposit_to_add", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                ("tx_ref", models.CharField(db_index=True, max_length=120, unique=True)),
                ("flw_charge_id", models.PositiveIntegerField(blank=True, null=True)),
                ("flw_ref", models.CharField(blank=True, max_length=80)),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("success", "Success"), ("failed", "Failed")],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("result_message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("completed_at", models.DateTimeField(blank=True, null=True)),
                (
                    "lease",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="flutterwave_rent_charges",
                        to="leases.lease",
                    ),
                ),
                (
                    "payment",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="flutterwave_rent_charge",
                        to="payments.payment",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="flutterwave_rent_charges",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "flutterwave_rent_charges",
                "ordering": ["-created_at"],
            },
        ),
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("mpesa", "M-Pesa (Daraja)"),
                    ("flutterwave_mpesa", "M-Pesa (Flutterwave)"),
                ],
                default="mpesa",
                max_length=50,
            ),
        ),
    ]
