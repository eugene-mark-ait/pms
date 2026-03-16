# Data migration: rename Role "landlord" to "property_owner" for inclusive terminology.

from django.db import migrations


def rename_landlord_to_property_owner(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(name="landlord").update(name="property_owner")


def reverse_rename(apps, schema_editor):
    Role = apps.get_model("accounts", "Role")
    Role.objects.filter(name="property_owner").update(name="landlord")


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(rename_landlord_to_property_owner, reverse_rename),
    ]
