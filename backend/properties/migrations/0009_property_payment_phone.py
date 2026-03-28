# Generated manually for Flutterwave landlord payout phone

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0008_rename_landlord_to_property_owner"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="payment_phone",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Kenyan M-Pesa number for landlord payouts (2547XXXXXXXX). Required for new properties when using Flutterwave.",
                max_length=15,
            ),
        ),
    ]
