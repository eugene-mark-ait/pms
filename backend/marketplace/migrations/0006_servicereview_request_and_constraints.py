# ServiceReview.service_request + per-request uniqueness; legacy (user, service) when request is null

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("marketplace", "0005_servicerequest_is_rated"),
    ]

    operations = [
        migrations.RemoveConstraint(
            model_name="servicereview",
            name="unique_user_service_review",
        ),
        migrations.AddField(
            model_name="servicereview",
            name="service_request",
            field=models.OneToOneField(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.CASCADE,
                related_name="service_review",
                to="marketplace.servicerequest",
            ),
        ),
        migrations.AddConstraint(
            model_name="servicereview",
            constraint=models.UniqueConstraint(
                condition=models.Q(("service_request__isnull", False)),
                fields=("service_request",),
                name="unique_marketplace_review_per_request",
            ),
        ),
        migrations.AddConstraint(
            model_name="servicereview",
            constraint=models.UniqueConstraint(
                condition=models.Q(
                    ("service_request__isnull", True),
                    ("service__isnull", False),
                ),
                fields=("user", "service"),
                name="unique_user_service_review_legacy",
            ),
        ),
    ]
