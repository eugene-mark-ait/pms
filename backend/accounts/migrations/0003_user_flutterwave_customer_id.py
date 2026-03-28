# Generated manually for Flutterwave customer id

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0002_rename_landlord_role_to_property_owner"),
    ]

    operations = [
        migrations.AddField(
            model_name="user",
            name="flutterwave_customer_id",
            field=models.CharField(
                blank=True,
                default="",
                help_text="Flutterwave customer id for recurring M-Pesa charges.",
                max_length=64,
            ),
        ),
    ]
