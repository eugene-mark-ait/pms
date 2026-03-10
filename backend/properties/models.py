import uuid
from django.db import models
from django.conf import settings


class Property(models.Model):
    """Property owned by a landlord; has units, managers, rules, images."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    address = models.TextField()
    location = models.CharField(max_length=255, blank=True, help_text="Short location label for search/display")
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


class PropertyImage(models.Model):
    """Image for a property (multiple allowed)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="properties/%Y/%m/")
    caption = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "property_images"
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"{self.property.name} image"


class Unit(models.Model):
    """Unit belonging to a property; has type, rent, vacancy, images."""
    class UnitType(models.TextChoices):
        APARTMENT = "apartment", "Apartment"
        STUDIO = "studio", "Studio"
        BEDSITTER = "bedsitter", "Bedsitter"
        ONE_BEDROOM = "one_bedroom", "One Bedroom"
        TWO_BEDROOM = "two_bedroom", "Two Bedroom"
        THREE_BEDROOM = "three_bedroom", "Three Bedroom"
        PENTHOUSE = "penthouse", "Penthouse"
        DUPLEX = "duplex", "Duplex"
        SHOP = "shop", "Shop"
        OFFICE = "office", "Office"
        WAREHOUSE = "warehouse", "Warehouse"
        RETAIL_SPACE = "retail_space", "Retail Space"
        KIOSK = "kiosk", "Kiosk"
        PARKING_SPACE = "parking_space", "Parking Space"
        STORAGE_UNIT = "storage_unit", "Storage Unit"
        COMMERCIAL_SPACE = "commercial_space", "Commercial Space"
        SERVICED_APARTMENT = "serviced_apartment", "Serviced Apartment"
        HOSTEL_ROOM = "hostel_room", "Hostel Room"
        AIRBNB_UNIT = "airbnb_unit", "Airbnb Unit"
        OTHER = "other", "Other"

    class PaymentFrequency(models.TextChoices):
        WEEKLY = "weekly", "Weekly"
        MONTHLY = "monthly", "Monthly"
        YEARLY = "yearly", "Yearly"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="units",
    )
    unit_number = models.CharField(max_length=50)
    unit_type = models.CharField(
        max_length=32,
        choices=UnitType.choices,
        default=UnitType.OTHER,
    )
    monthly_rent = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text="Base rent for listing; lease can override.",
    )
    security_deposit = models.DecimalField(max_digits=12, decimal_places=2, default=0, blank=True)
    service_charge = models.DecimalField(max_digits=12, decimal_places=2, default=0, blank=True)
    extra_costs = models.CharField(max_length=500, blank=True, help_text="Optional description of extra costs")
    payment_frequency = models.CharField(
        max_length=20,
        choices=PaymentFrequency.choices,
        default=PaymentFrequency.MONTHLY,
    )
    is_vacant = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "units"
        unique_together = [["property", "unit_number"]]

    def __str__(self):
        return f"{self.property.name} - {self.unit_number}"


class UnitImage(models.Model):
    """Image for a unit (multiple allowed)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="images",
    )
    image = models.ImageField(upload_to="units/%Y/%m/")
    caption = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "unit_images"
        ordering = ["sort_order", "created_at"]

    def __str__(self):
        return f"{self.unit} image"


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
    """Assignment of a manager to a property; optional contact phone."""
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
    contact_phone = models.CharField(max_length=20, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "manager_assignments"
        unique_together = [["property", "manager"]]

    def __str__(self):
        return f"{self.manager.email} -> {self.property.name}"


class CaretakerAssignment(models.Model):
    """Assignment of a caretaker to a property (by landlord); optional contact phone."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    property = models.ForeignKey(
        Property,
        on_delete=models.CASCADE,
        related_name="caretaker_assignments",
    )
    caretaker = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="caretaker_properties",
    )
    contact_phone = models.CharField(max_length=20, blank=True)
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "caretaker_assignments"
        unique_together = [["property", "caretaker"]]

    def __str__(self):
        return f"{self.caretaker.email} -> {self.property.name}"
