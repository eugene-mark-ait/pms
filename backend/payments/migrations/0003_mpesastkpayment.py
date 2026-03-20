# MpesaStkPayment for Daraja STK Push rent flow

import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("leases", "0003_add_eviction_notice"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("payments", "0002_payment_method_mpesa_only"),
    ]

    operations = [
        migrations.CreateModel(
            name="MpesaStkPayment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("months_paid_for", models.PositiveIntegerField()),
                ("phone", models.CharField(max_length=20)),
                ("amount", models.DecimalField(decimal_places=2, max_digits=12)),
                ("deposit_to_add", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("period_start", models.DateField()),
                ("period_end", models.DateField()),
                (
                    "status",
                    models.CharField(
                        choices=[("pending", "Pending"), ("success", "Success"), ("failed", "Failed")],
                        db_index=True,
                        default="pending",
                        max_length=20,
                    ),
                ),
                ("checkout_request_id", models.CharField(db_index=True, max_length=80, unique=True)),
                ("merchant_request_id", models.CharField(blank=True, max_length=80)),
                ("mpesa_receipt_number", models.CharField(blank=True, max_length=80)),
                ("result_code", models.IntegerField(blank=True, null=True)),
                ("result_desc", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "lease",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mpesa_stk_payments",
                        to="leases.lease",
                    ),
                ),
                (
                    "payment",
                    models.OneToOneField(
                        blank=True,
                        null=True,
                        on_delete=django.db.models.deletion.SET_NULL,
                        related_name="mpesa_stk",
                        to="payments.payment",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="mpesa_stk_payments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "db_table": "mpesa_stk_payments",
                "ordering": ["-created_at"],
            },
        ),
    ]
