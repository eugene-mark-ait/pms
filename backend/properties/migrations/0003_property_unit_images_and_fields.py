# Generated manually: property/unit images, location, unit type/rent/vacant, contact_phone

import uuid
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0002_add_caretaker_assignment"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="location",
            field=models.CharField(blank=True, help_text="Short location label for search/display", max_length=255),
        ),
        migrations.CreateModel(
            name="PropertyImage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("image", models.ImageField(upload_to="properties/%Y/%m/")),
                ("caption", models.CharField(blank=True, max_length=255)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="properties.property")),
            ],
            options={
                "db_table": "property_images",
                "ordering": ["sort_order", "created_at"],
            },
        ),
        migrations.AddField(
            model_name="unit",
            name="unit_type",
            field=models.CharField(
                choices=[
                    ("bedsitter", "Bedsitter"),
                    ("studio", "Studio"),
                    ("one_bedroom", "One Bedroom"),
                    ("two_bedroom", "Two Bedroom"),
                    ("three_bedroom", "Three Bedroom"),
                    ("penthouse", "Penthouse"),
                    ("other", "Other"),
                ],
                default="other",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="unit",
            name="monthly_rent",
            field=models.DecimalField(decimal_places=2, default=0, help_text="Base rent for listing; lease can override.", max_digits=12),
        ),
        migrations.AddField(
            model_name="unit",
            name="is_vacant",
            field=models.BooleanField(default=True),
        ),
        migrations.CreateModel(
            name="UnitImage",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("image", models.ImageField(upload_to="units/%Y/%m/")),
                ("caption", models.CharField(blank=True, max_length=255)),
                ("sort_order", models.PositiveIntegerField(default=0)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="images", to="properties.unit")),
            ],
            options={
                "db_table": "unit_images",
                "ordering": ["sort_order", "created_at"],
            },
        ),
        migrations.AddField(
            model_name="managerassignment",
            name="contact_phone",
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name="caretakerassignment",
            name="contact_phone",
            field=models.CharField(blank=True, max_length=20),
        ),
    ]
