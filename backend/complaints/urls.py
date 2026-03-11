from django.urls import path
from . import views

urlpatterns = [
    path("complaints/open_count/", views.ComplaintOpenCountView.as_view(), name="complaint-open-count"),
    path("complaints/", views.ComplaintListCreateView.as_view(), name="complaint-list"),
    path("complaints/<uuid:pk>/", views.ComplaintDetailView.as_view(), name="complaint-detail"),
]
