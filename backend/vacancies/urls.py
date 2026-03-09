from django.urls import path
from . import views

urlpatterns = [
    path("vacancies/", views.VacancyListingListView.as_view(), name="vacancy-list"),
]
