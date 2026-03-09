from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .models import VacancyListing
from .serializers import VacancyListingSerializer
from accounts.permissions import IsLandlordOrManager


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
