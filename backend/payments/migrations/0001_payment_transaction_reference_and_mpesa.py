# Add transaction_reference and M-Pesa payment method

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "__first__"),
    ]

    operations = [
        migrations.AddField(
            model_name="payment",
            name="transaction_reference",
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[
                    ("card", "Card"),
                    ("bank_transfer", "Bank Transfer"),
                    ("cash", "Cash"),
                    ("check", "Check"),
                    ("mpesa", "M-Pesa"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=50,
            ),
        ),
    ]
