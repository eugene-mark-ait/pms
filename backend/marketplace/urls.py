from django.urls import path
from . import views

urlpatterns = [
    path("marketplace/services/", views.ServiceListCreateView.as_view(), name="marketplace-service-list-create"),
    path("marketplace/my-services/", views.MyServicesView.as_view(), name="marketplace-my-services"),
    path("marketplace/services/<uuid:pk>/", views.ServiceDetailView.as_view(), name="marketplace-service-detail"),
    path("marketplace/insights/", views.MarketplaceInsightsView.as_view(), name="marketplace-insights"),
]
