from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("leases", "0003_add_eviction_notice"),
        ("properties", "0008_rename_landlord_to_property_owner"),
        ("vacancies", "0009_tenantunitalert_email_phone"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantScore",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("overall_score", models.PositiveSmallIntegerField(default=500, help_text="Range 300-900")),
                ("payment_consistency", models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")),
                ("maintenance_behavior", models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")),
                ("service_reliability", models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")),
                ("landlord_rating", models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")),
                ("dispute_history", models.PositiveSmallIntegerField(default=50, help_text="Range 0-100")),
                ("explainability", models.JSONField(blank=True, default=dict)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "tenant",
                    models.OneToOneField(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="platform_tenant_score",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"db_table": "tenant_scores"},
        ),
        migrations.CreateModel(
            name="VacancyPrediction",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("predicted_vacancy_date", models.DateField()),
                ("confidence", models.DecimalField(decimal_places=2, default=0.0, help_text="0.00-1.00", max_digits=5)),
                ("risk_level", models.CharField(default="low", max_length=16)),
                ("factors", models.JSONField(blank=True, default=list)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "lease",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="vacancy_predictions", to="leases.lease"),
                ),
                (
                    "unit",
                    models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="vacancy_prediction", to="properties.unit"),
                ),
            ],
            options={"db_table": "vacancy_predictions"},
        ),
        migrations.CreateModel(
            name="UnitTenantRanking",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("score", models.DecimalField(decimal_places=4, max_digits=8)),
                ("rank", models.PositiveIntegerField()),
                ("reason_codes", models.JSONField(blank=True, default=list)),
                ("generated_at", models.DateTimeField(auto_now_add=True)),
                (
                    "tenant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="unit_rankings", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "unit",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="tenant_rankings", to="properties.unit"),
                ),
            ],
            options={
                "db_table": "unit_tenant_rankings",
                "ordering": ["rank", "-score", "generated_at"],
                "unique_together": {("unit", "tenant", "generated_at")},
            },
        ),
        migrations.CreateModel(
            name="UnitAllocationReservation",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("status", models.CharField(choices=[("active", "Active"), ("expired", "Expired"), ("accepted", "Accepted"), ("declined", "Declined")], default="active", max_length=16)),
                ("window_start", models.DateTimeField()),
                ("window_end", models.DateTimeField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "ranking",
                    models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name="reservations", to="vacancies.unittenantranking"),
                ),
                (
                    "tenant",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="allocation_reservations", to=settings.AUTH_USER_MODEL),
                ),
                (
                    "unit",
                    models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="allocation_reservations", to="properties.unit"),
                ),
            ],
            options={"db_table": "unit_allocation_reservations", "ordering": ["-created_at"]},
        ),
    ]
