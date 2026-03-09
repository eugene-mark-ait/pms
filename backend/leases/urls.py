from django.urls import path
from . import views

urlpatterns = [
    path("leases/", views.LeaseListCreateView.as_view(), name="lease-list"),
    path("leases/<uuid:pk>/", views.LeaseDetailView.as_view(), name="lease-detail"),
    path("tenant/my-units/", views.TenantMyUnitsView.as_view(), name="tenant-my-units"),
    path("leases/give-notice/", views.GiveNoticeView.as_view(), name="give-notice"),
]
