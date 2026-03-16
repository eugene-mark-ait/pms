# Rename show_landlord_phone -> show_property_owner_phone for inclusive terminology.

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("vacancies", "0006_unit_application"),
    ]

    operations = [
        migrations.RenameField(
            model_name="unitvacancyinfo",
            old_name="show_landlord_phone",
            new_name="show_property_owner_phone",
        ),
    ]
