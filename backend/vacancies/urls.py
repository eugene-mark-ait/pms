from django.urls import path
from . import views

urlpatterns = [
    path("vacancies/", views.VacancyListingListView.as_view(), name="vacancy-list"),
    path("vacancies/notice/<uuid:pk>/cancel/", views.CancelNoticeView.as_view(), name="vacancy-notice-cancel"),
    path("vacancies/search/", views.VacancySearchView.as_view(), name="vacancy-search"),
    path("vacancies/discovery/<uuid:unit_id>/", views.VacancyDiscoveryDetailView.as_view(), name="vacancy-discovery-detail"),
    path("vacancies/my-preference/", views.TenantVacancyPreferenceView.as_view(), name="vacancy-my-preference"),
    path("vacancies/matches/", views.VacancyMatchesView.as_view(), name="vacancy-matches"),
    path("vacancies/units/<uuid:unit_id>/apply/", views.UnitApplyView.as_view(), name="unit-apply"),
    path("vacancies/units/<uuid:unit_id>/applications/", views.UnitApplicationListView.as_view(), name="unit-application-list"),
    path("vacancies/applications/<uuid:pk>/approve/", views.ApplicationApproveView.as_view(), name="application-approve"),
    path("vacancies/applications/<uuid:pk>/decline/", views.ApplicationDeclineView.as_view(), name="application-decline"),
]
