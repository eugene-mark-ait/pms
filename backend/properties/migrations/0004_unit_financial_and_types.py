# Unit: expanded unit types, security_deposit, service_charge, extra_costs, payment_frequency

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0003_property_unit_images_and_fields"),
    ]

    operations = [
        migrations.AddField(
            model_name="unit",
            name="security_deposit",
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="unit",
            name="service_charge",
            field=models.DecimalField(blank=True, decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name="unit",
            name="extra_costs",
            field=models.CharField(blank=True, help_text="Optional description of extra costs", max_length=500),
        ),
        migrations.AddField(
            model_name="unit",
            name="payment_frequency",
            field=models.CharField(
                choices=[("weekly", "Weekly"), ("monthly", "Monthly"), ("yearly", "Yearly")],
                default="monthly",
                max_length=20,
            ),
        ),
        migrations.AlterField(
            model_name="unit",
            name="unit_type",
            field=models.CharField(
                choices=[
                    ("apartment", "Apartment"),
                    ("studio", "Studio"),
                    ("bedsitter", "Bedsitter"),
                    ("one_bedroom", "One Bedroom"),
                    ("two_bedroom", "Two Bedroom"),
                    ("three_bedroom", "Three Bedroom"),
                    ("penthouse", "Penthouse"),
                    ("duplex", "Duplex"),
                    ("shop", "Shop"),
                    ("office", "Office"),
                    ("warehouse", "Warehouse"),
                    ("retail_space", "Retail Space"),
                    ("kiosk", "Kiosk"),
                    ("parking_space", "Parking Space"),
                    ("storage_unit", "Storage Unit"),
                    ("commercial_space", "Commercial Space"),
                    ("serviced_apartment", "Serviced Apartment"),
                    ("hostel_room", "Hostel Room"),
                    ("airbnb_unit", "Airbnb Unit"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=32,
            ),
        ),
    ]
