# Rename landlord -> property_owner for inclusive terminology. Safe for existing data.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0007_property_public_listing_fields"),
    ]

    operations = [
        migrations.RenameField(
            model_name="property",
            old_name="landlord",
            new_name="property_owner",
        ),
    ]
