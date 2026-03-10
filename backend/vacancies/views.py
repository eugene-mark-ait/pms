from rest_framework import generics
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.utils import timezone

from .models import VacancyListing, TenantVacancyPreference
from .serializers import (
    VacancyListingSerializer,
    VacancySearchSerializer,
    TenantVacancyPreferenceSerializer,
)
from accounts.permissions import IsLandlordOrManager, IsTenant


class VacancyListingListView(generics.ListAPIView):
    """GET /api/vacancies/ - list upcoming vacancies (landlord/manager)."""
    permission_classes = [IsAuthenticated, IsLandlordOrManager]
    serializer_class = VacancyListingSerializer

    def get_queryset(self):
        user = self.request.user
        qs = VacancyListing.objects.filter(is_filled=False).select_related("property", "unit")
        if user.has_role("landlord"):
            return qs.filter(property__landlord=user).order_by("available_from")
        if user.has_role("manager"):
            return qs.filter(property__manager_assignments__manager=user).distinct().order_by("available_from")
        return qs.none()


class VacancySearchView(generics.ListAPIView):
    """GET /api/vacancies/search/?unit_type=&location= - search vacancies (tenant or public). Match by unit type and location."""
    permission_classes = [AllowAny]
    serializer_class = VacancySearchSerializer

    def get_queryset(self):
        from django.db.models import Q
        qs = (
            VacancyListing.objects.filter(
                is_filled=False,
                available_from__gte=timezone.now().date(),
            )
            .select_related("property", "unit__property")
            .prefetch_related("unit__images", "property__images")
        )
        unit_type = self.request.query_params.get("unit_type", "").strip()
        location = self.request.query_params.get("location", "").strip()
        if unit_type:
            qs = qs.filter(unit__unit_type=unit_type)
        if location:
            qs = qs.filter(
                Q(property__location__icontains=location) | Q(property__address__icontains=location)
            )
        return qs.order_by("available_from")


class TenantVacancyPreferenceView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/vacancies/my-preference/ - tenant's vacancy search preferences (is_looking, unit type, location)."""
    permission_classes = [IsAuthenticated, IsTenant]
    serializer_class = TenantVacancyPreferenceSerializer

    def get_object(self):
        pref, _ = TenantVacancyPreference.objects.get_or_create(user=self.request.user)
        return pref
