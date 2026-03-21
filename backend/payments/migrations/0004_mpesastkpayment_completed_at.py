# Generated manually for M-PESA STK callback completion timestamp

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0003_mpesastkpayment"),
    ]

    operations = [
        migrations.AddField(
            model_name="mpesastkpayment",
            name="completed_at",
            field=models.DateTimeField(blank=True, db_index=True, null=True),
        ),
    ]
