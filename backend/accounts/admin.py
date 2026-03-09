from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import Role, User, UserSocialAuth


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("email", "first_name", "last_name", "is_staff", "is_active")
    list_filter = ("is_staff", "is_active", "roles")
    search_fields = ("email", "first_name", "last_name")
    ordering = ("email",)
    filter_horizontal = ("roles", "groups", "user_permissions")

    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ("Personal info", {"fields": ("first_name", "last_name", "phone")}),
        ("Roles", {"fields": ("roles",)}),
        (
            "Permissions",
            {
                "fields": (
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        ("Important dates", {"fields": ("last_login", "date_joined")}),
    )
    add_fieldsets = (
        (None, {"classes": ("wide",), "fields": ("email", "password1", "password2")}),
    )


@admin.register(UserSocialAuth)
class UserSocialAuthAdmin(admin.ModelAdmin):
    list_display = ("user", "provider", "provider_user_id", "created_at")
    list_filter = ("provider",)
    search_fields = ("user__email", "provider_user_id")
