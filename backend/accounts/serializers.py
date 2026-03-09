from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Role

User = get_user_model()


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "name"]


class UserSerializer(serializers.ModelSerializer):
    roles = RoleSerializer(many=True, read_only=True)
    role_names = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "phone",
            "roles",
            "role_names",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]

    def get_role_names(self, obj):
        return list(obj.roles.values_list("name", flat=True))


class UserUpdateRolesSerializer(serializers.Serializer):
    """Payload for assigning roles to a user (role_names list)."""
    role_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        allow_empty=True,
    )

    def validate_role_names(self, value):
        from .models import Role
        valid = set(Role.objects.values_list("name", flat=True))
        invalid = [n for n in value if n not in valid]
        if invalid:
            raise serializers.ValidationError(f"Invalid role(s): {invalid}. Valid: {list(valid)}")
        return value


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ["email", "password", "first_name", "last_name", "phone"]

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        return user
