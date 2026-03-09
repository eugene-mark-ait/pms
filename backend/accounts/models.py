import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models


class Role(models.Model):
    """Role for multi-role users (landlord, manager, tenant, caretaker)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, unique=True)

    class Meta:
        db_table = "roles"

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Users must have an email address")
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        if password is None:
            user.set_unusable_password()
        else:
            user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user model with email as username and many-to-many roles."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = None
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    roles = models.ManyToManyField(Role, related_name="users", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = UserManager()

    class Meta:
        db_table = "users"

    def __str__(self):
        return self.email

    def has_role(self, role_name: str) -> bool:
        return self.roles.filter(name=role_name).exists()


class UserSocialAuth(models.Model):
    """Links a user to an external provider (Google, Facebook, etc.) for scalable social login."""
    class Provider(models.TextChoices):
        GOOGLE = "google", "Google"
        # Add more as needed: FACEBOOK = "facebook", "Facebook", GITHUB = "github", "GitHub"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="social_auths",
    )
    provider = models.CharField(max_length=32, choices=Provider.choices)
    provider_user_id = models.CharField(max_length=255)
    extra_data = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "user_social_auths"
        unique_together = [["provider", "provider_user_id"]]

    def __str__(self):
        return f"{self.user.email} ({self.provider})"
