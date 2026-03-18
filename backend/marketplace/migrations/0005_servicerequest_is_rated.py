# Add is_rated to ServiceRequest for rating flow (actioned but not yet rated)

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0004_index_created_at_id"),
    ]

    operations = [
        migrations.AddField(
            model_name="servicerequest",
            name="is_rated",
            field=models.BooleanField(default=False, help_text="True after the requester has submitted a rating for this actioned request."),
        ),
    ]
