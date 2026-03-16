# Public listing fields for Find Units

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("properties", "0006_unit_is_reserved"),
    ]

    operations = [
        migrations.AddField(
            model_name="property",
            name="public_description",
            field=models.TextField(blank=True, help_text="Description shown on public vacancy listings."),
        ),
        migrations.AddField(
            model_name="property",
            name="amenities",
            field=models.TextField(blank=True, help_text="e.g. Water, security, gym."),
        ),
        migrations.AddField(
            model_name="property",
            name="parking_info",
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="property",
            name="nearby_landmarks",
            field=models.CharField(blank=True, max_length=500),
        ),
        migrations.AddField(
            model_name="property",
            name="house_rules",
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name="property",
            name="contact_preference",
            field=models.CharField(
                blank=True,
                help_text="e.g. Call preferred, WhatsApp, email.",
                max_length=100,
            ),
        ),
    ]
