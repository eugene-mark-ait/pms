from django.urls import path
from . import views

urlpatterns = [
    path("complaints/", views.ComplaintListCreateView.as_view(), name="complaint-list"),
    path("complaints/<uuid:pk>/", views.ComplaintDetailView.as_view(), name="complaint-detail"),
]
