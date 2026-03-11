# Add lease FK to Complaint

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("leases", "0001_initial"),
        ("complaints", "0002_priority_and_assigned_to"),
    ]

    operations = [
        migrations.AddField(
            model_name="complaint",
            name="lease",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name="complaints",
                to="leases.lease",
            ),
        ),
    ]
