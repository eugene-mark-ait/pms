import uuid
from django.db import models
from django.conf import settings


class Property(models.Model):
    """Property owned by a landlord; has units, managers, rules."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField()
    landlord = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_properties",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "properties"
        verbose_name_plural = "properties"

    def __str__(self):
        return self.name


class Unit(models.Model):
    """Unit belonging to a property."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="units",
    )
    unit_number = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "units"
        unique_together = [["property", "unit_number"]]

    def __str__(self):
        return f"{self.property.name} - {self.unit_number}"


class PropertyRule(models.Model):
    """Rules for a property."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="rules",
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "property_rules"

    def __str__(self):
        return f"{self.property.name}: {self.title}"


class ManagerAssignment(models.Model):
    """Assignment of a manager to a property."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="manager_assignments",
    )
    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="managed_properties",
    )
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "manager_assignments"
        unique_together = [["property", "manager"]]

    def __str__(self):
        return f"{self.manager.email} -> {self.property.name}"
