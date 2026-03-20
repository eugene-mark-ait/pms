# Index for provider inbox filters: pending vs actioned

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0006_servicereview_request_and_constraints"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="servicerequest",
            index=models.Index(
                fields=["provider", "status", "created_at", "id"],
                name="svc_req_prov_stat_crt_idx",
            ),
        ),
    ]
