# Generated manually - initial Property, Unit, PropertyRule, ManagerAssignment

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Property",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("name", models.CharField(max_length=255)),
                ("address", models.TextField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("landlord", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="owned_properties", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "properties",
                "verbose_name_plural": "properties",
            },
        ),
        migrations.CreateModel(
            name="Unit",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("unit_number", models.CharField(max_length=50)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="units", to="properties.property")),
            ],
            options={
                "db_table": "units",
                "unique_together": {("property", "unit_number")},
            },
        ),
        migrations.CreateModel(
            name="PropertyRule",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("title", models.CharField(max_length=255)),
                ("description", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="rules", to="properties.property")),
            ],
            options={
                "db_table": "property_rules",
            },
        ),
        migrations.CreateModel(
            name="ManagerAssignment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("assigned_at", models.DateTimeField(auto_now_add=True)),
                ("manager", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="managed_properties", to=settings.AUTH_USER_MODEL)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="manager_assignments", to="properties.property")),
            ],
            options={
                "db_table": "manager_assignments",
                "unique_together": {("property", "manager")},
            },
        ),
    ]
