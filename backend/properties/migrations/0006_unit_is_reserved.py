# Add Unit.is_reserved for vacancy discovery (reserved = not discoverable)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0005_add_property_is_closed"),
    ]

    operations = [
        migrations.AddField(
            model_name="unit",
            name="is_reserved",
            field=models.BooleanField(
                default=False,
                help_text="When True, unit is reserved and hidden from public vacancy discovery.",
            ),
        ),
    ]
