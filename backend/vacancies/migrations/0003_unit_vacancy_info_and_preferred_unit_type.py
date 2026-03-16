# UnitVacancyInfo for vacancy contact visibility; extend preferred_unit_type max_length

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0006_unit_is_reserved"),
        ("vacancies", "0002_add_notice_cancelled"),
    ]

    operations = [
        migrations.CreateModel(
            name="UnitVacancyInfo",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("available_from", models.DateField(help_text="Date from which the unit is available.")),
                ("show_landlord_phone", models.BooleanField(default=False)),
                ("show_manager_phone", models.BooleanField(default=False)),
                ("show_caretaker_phone", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("unit", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vacancy_info", to="properties.unit")),
            ],
            options={
                "db_table": "unit_vacancy_info",
            },
        ),
        migrations.AlterField(
            model_name="tenantvacancypreference",
            name="preferred_unit_type",
            field=models.CharField(blank=True, choices=[("apartment", "Apartment"), ("studio", "Studio"), ("bedsitter", "Bedsitter"), ("one_bedroom", "One Bedroom"), ("two_bedroom", "Two Bedroom"), ("three_bedroom", "Three Bedroom"), ("penthouse", "Penthouse"), ("duplex", "Duplex"), ("shop", "Shop"), ("office", "Office"), ("warehouse", "Warehouse"), ("retail_space", "Retail Space"), ("kiosk", "Kiosk"), ("parking_space", "Parking Space"), ("storage_unit", "Storage Unit"), ("commercial_space", "Commercial Space"), ("serviced_apartment", "Serviced Apartment"), ("hostel_room", "Hostel Room"), ("airbnb_unit", "Airbnb Unit"), ("other", "Other")], max_length=32),
        ),
    ]
