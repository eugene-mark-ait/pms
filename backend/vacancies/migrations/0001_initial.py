# VacateNotice, VacancyListing, TenantVacancyPreference

import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("properties", "0001_initial"),
        ("leases", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantVacancyPreference",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("is_looking", models.BooleanField(default=False)),
                ("preferred_unit_type", models.CharField(blank=True, choices=[("bedsitter", "Bedsitter"), ("studio", "Studio"), ("one_bedroom", "One Bedroom"), ("two_bedroom", "Two Bedroom"), ("three_bedroom", "Three Bedroom"), ("penthouse", "Penthouse"), ("other", "Other")], max_length=20)),
                ("preferred_location", models.CharField(blank=True, max_length=255)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vacancy_preference", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "tenant_vacancy_preferences",
            },
        ),
        migrations.CreateModel(
            name="VacateNotice",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("move_out_date", models.DateField()),
                ("reason", models.CharField(blank=True, max_length=255)),
                ("notice_message", models.TextField(blank=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("lease", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vacate_notices", to="leases.lease")),
            ],
            options={
                "db_table": "vacate_notices",
                "ordering": ["-created_at"],
            },
        ),
        migrations.CreateModel(
            name="VacancyListing",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("available_from", models.DateField()),
                ("is_filled", models.BooleanField(default=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("property", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vacancy_listings", to="properties.property")),
                ("unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vacancy_listings", to="properties.unit")),
                ("vacate_notice", models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="vacancy_listing", to="vacancies.vacatenotice")),
            ],
            options={
                "db_table": "vacancy_listings",
                "ordering": ["available_from"],
            },
        ),
    ]
