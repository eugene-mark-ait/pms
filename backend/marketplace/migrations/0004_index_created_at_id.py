# Add composite index for cursor pagination: (created_at, id) on service_requests and marketplace_services

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0003_service_image"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="servicerequest",
            index=models.Index(fields=["created_at", "id"], name="service_req_created_idx"),
        ),
        migrations.AddIndex(
            model_name="service",
            index=models.Index(fields=["created_at", "id"], name="marketplace_s_created_idx"),
        ),
    ]
