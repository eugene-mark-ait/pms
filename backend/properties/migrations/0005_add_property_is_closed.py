# Property: is_closed for manager/landlord to end a property

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0004_unit_financial_and_types"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="is_closed",
            field=models.BooleanField(
                default=False,
                help_text="When True, property is ended/closed (e.g. by manager). No new leases; existing data retained.",
            ),
        ),
    ]
