from django.urls import path, include
from . import views

urlpatterns = [
    path("properties/", views.PropertyListCreateView.as_view(), name="property-list"),
    path("properties/<uuid:pk>/", views.PropertyDetailView.as_view(), name="property-detail"),
    path("units/", views.UnitListCreateView.as_view(), name="unit-list"),
    path("units/<uuid:pk>/", views.UnitDetailView.as_view(), name="unit-detail"),
]
