from django.urls import path
from . import views

urlpatterns = [
    path("vacancies/", views.VacancyListingListView.as_view(), name="vacancy-list"),
    path("vacancies/search/", views.VacancySearchView.as_view(), name="vacancy-search"),
    path("vacancies/my-preference/", views.TenantVacancyPreferenceView.as_view(), name="vacancy-my-preference"),
]
