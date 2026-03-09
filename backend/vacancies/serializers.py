from rest_framework import serializers
from .models import VacateNotice, VacancyListing
from properties.serializers import UnitSerializer


class VacateNoticeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VacateNotice
        fields = ["id", "lease", "move_out_date", "reason", "notice_message", "created_at"]


class VacancyListingSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)

    class Meta:
        model = VacancyListing
        fields = ["id", "property", "unit", "available_from", "is_filled", "created_at"]
