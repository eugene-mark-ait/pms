from rest_framework import serializers
from .models import Service, ServiceReview, ServiceRequest

# Default image when service has no upload; avoid hardcoding in multiple places
DEFAULT_SERVICE_IMAGE_PATH = "/static/defaults/service-placeholder.png"


class ServiceSerializer(serializers.ModelSerializer):
    provider_name = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    review_count = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Service
        fields = [
            "id",
            "provider",
            "provider_name",
            "title",
            "category",
            "description",
            "price_range",
            "min_price",
            "max_price",
            "service_area",
            "availability",
            "contact_info",
            "image",
            "image_url",
            "average_rating",
            "review_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "provider", "created_at", "updated_at"]

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get("request")
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(DEFAULT_SERVICE_IMAGE_PATH)
        return DEFAULT_SERVICE_IMAGE_PATH

    def get_provider_name(self, obj):
        if not obj.provider_id:
            return None
        name = f"{obj.provider.first_name or ''} {obj.provider.last_name or ''}".strip()
        return name or obj.provider.email

    def get_average_rating(self, obj):
        return obj.average_rating()

    def get_review_count(self, obj):
        return obj.review_count()


class ServiceCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = [
            "title",
            "category",
            "description",
            "price_range",
            "min_price",
            "max_price",
            "service_area",
            "availability",
            "contact_info",
        ]

    def validate_title(self, value):
        if not (value and value.strip()):
            raise serializers.ValidationError("Service title is required.")
        return value.strip()

    def validate_description(self, value):
        if not (value and value.strip()):
            raise serializers.ValidationError("Description is required.")
        return value.strip()

    def validate_service_area(self, value):
        if not (value and value.strip()):
            raise serializers.ValidationError("Service area / location is required.")
        return value.strip()

    def validate(self, attrs):
        min_p = attrs.get("min_price")
        max_p = attrs.get("max_price")
        if min_p is not None and min_p < 0:
            raise serializers.ValidationError({"min_price": "min_price must be >= 0."})
        if max_p is not None and max_p < 0:
            raise serializers.ValidationError({"max_price": "max_price must be >= 0."})
        if min_p is not None and max_p is not None and min_p > max_p:
            raise serializers.ValidationError({"max_price": "max_price must be >= min_price."})
        return attrs


class ServiceReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceReview
        fields = ["id", "user", "provider", "service", "rating", "review", "created_at"]
        read_only_fields = ["id", "user", "provider", "service", "created_at"]

    def validate_rating(self, value):
        if value is None or value < 1 or value > 5:
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value


class ServiceRequestSerializer(serializers.ModelSerializer):
    service_title = serializers.CharField(source="service.title", read_only=True)
    service_category = serializers.CharField(source="service.category", read_only=True)
    requester_email = serializers.EmailField(source="user.email", read_only=True)
    requester_phone = serializers.CharField(source="user.phone", read_only=True, allow_blank=True)

    class Meta:
        model = ServiceRequest
        fields = [
            "id", "user", "requester_email", "requester_phone", "provider", "service", "service_title", "service_category",
            "message", "preferred_date", "status", "created_at",
        ]
        read_only_fields = ["id", "user", "provider", "service", "status", "created_at"]
