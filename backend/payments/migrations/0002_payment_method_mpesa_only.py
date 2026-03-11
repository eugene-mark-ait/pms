# Only M-Pesa payment method; migrate existing rows to mpesa

from django.db import migrations, models


def set_all_payments_mpesa(apps, schema_editor):
    Payment = apps.get_model("payments", "Payment")
    Payment.objects.exclude(payment_method="mpesa").update(payment_method="mpesa")


class Migration(migrations.Migration):

    dependencies = [
        ("payments", "0001_payment_transaction_reference_and_mpesa"),
    ]

    operations = [
        migrations.RunPython(set_all_payments_mpesa, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="payment",
            name="payment_method",
            field=models.CharField(
                choices=[("mpesa", "M-Pesa")],
                default="mpesa",
                max_length=50,
            ),
        ),
    ]
