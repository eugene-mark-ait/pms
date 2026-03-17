# Add contact method (email, phone) to TenantUnitAlert for vacancy notifications

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("vacancies", "0008_tenantunitalert"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenantunitalert",
            name="email",
            field=models.EmailField(blank=True, max_length=254),
        ),
        migrations.AddField(
            model_name="tenantunitalert",
            name="phone",
            field=models.CharField(blank=True, max_length=20),
        ),
    ]
