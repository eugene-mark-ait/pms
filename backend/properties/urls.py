from django.urls import path
from . import views

urlpatterns = [
    path("properties/", views.PropertyListCreateView.as_view(), name="property-list"),
    path("properties/<uuid:pk>/", views.PropertyDetailView.as_view(), name="property-detail"),
    path("properties/<uuid:pk>/images/", views.PropertyImageUploadView.as_view(), name="property-images-upload"),
    path("properties/<uuid:pk>/images/<uuid:image_id>/", views.PropertyImageDeleteView.as_view(), name="property-image-delete"),
    path("properties/<uuid:pk>/managers/", views.PropertyManagerAddView.as_view(), name="property-managers-add"),
    path("properties/<uuid:pk>/managers/<uuid:user_id>/", views.PropertyManagerRemoveView.as_view(), name="property-managers-remove"),
    path("properties/<uuid:pk>/caretakers/", views.PropertyCaretakerAddView.as_view(), name="property-caretakers-add"),
    path("properties/<uuid:pk>/caretakers/<uuid:user_id>/", views.PropertyCaretakerRemoveView.as_view(), name="property-caretakers-remove"),
    path("units/", views.UnitListCreateView.as_view(), name="unit-list"),
    path("units/bulk/", views.UnitBulkCreateView.as_view(), name="unit-bulk-create"),
    path("units/<uuid:pk>/", views.UnitDetailView.as_view(), name="unit-detail"),
]
