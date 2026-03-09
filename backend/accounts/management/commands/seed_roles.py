from django.core.management.base import BaseCommand
from accounts.models import Role


class Command(BaseCommand):
    help = "Create default roles (landlord, manager, tenant, caretaker)"

    def handle(self, *args, **options):
        for name in ["landlord", "manager", "tenant", "caretaker"]:
            _, created = Role.objects.get_or_create(name=name)
            if created:
                self.stdout.write(self.style.SUCCESS(f"Created role: {name}"))
            else:
                self.stdout.write(f"Role already exists: {name}")
