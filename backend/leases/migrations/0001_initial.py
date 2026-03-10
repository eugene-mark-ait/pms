import uuid
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("properties", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="TenantProfile",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name="tenant_profile", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "db_table": "tenant_profiles",
            },
        ),
        migrations.CreateModel(
            name="Lease",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("monthly_rent", models.DecimalField(decimal_places=2, max_digits=12)),
                ("deposit_amount", models.DecimalField(decimal_places=2, default=0, max_digits=12)),
                ("deposit_paid", models.BooleanField(default=False)),
                ("start_date", models.DateField()),
                ("end_date", models.DateField()),
                ("is_active", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("tenant", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="leases", to=settings.AUTH_USER_MODEL)),
                ("unit", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="leases", to="properties.unit")),
            ],
            options={
                "db_table": "leases",
                "ordering": ["-start_date"],
            },
        ),
    ]
