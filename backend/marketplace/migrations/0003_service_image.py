# Add optional image to Service for provider uploads

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0002_service_pricing_reviews_requests"),
    ]

    operations = [
        migrations.AddField(
            model_name="service",
            name="image",
            field=models.ImageField(blank=True, max_length=500, null=True, upload_to="marketplace/services/"),
        ),
    ]
