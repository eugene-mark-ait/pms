from django.urls import path
from . import views

urlpatterns = [
    path("marketplace/services/", views.ServiceListCreateView.as_view(), name="marketplace-service-list-create"),
    path("marketplace/my-services/", views.MyServicesView.as_view(), name="marketplace-my-services"),
    path("marketplace/services/<uuid:pk>/", views.ServiceDetailView.as_view(), name="marketplace-service-detail"),
    path("marketplace/services/<uuid:pk>/upload-image/", views.ServiceImageUploadView.as_view(), name="marketplace-service-upload-image"),
    path("marketplace/services/<uuid:pk>/reviews/", views.ServiceReviewListCreateView.as_view(), name="marketplace-service-reviews"),
    path("marketplace/services/<uuid:pk>/request/", views.ServiceRequestCreateView.as_view(), name="marketplace-service-request"),
    path("marketplace/my-sent-requests/", views.MySentRequestsView.as_view(), name="marketplace-my-sent-requests"),
    path("marketplace/my-sent-requests/summary/", views.MySentRequestsSummaryView.as_view(), name="marketplace-my-sent-requests-summary"),
    path("marketplace/my-requests/", views.MyRequestsView.as_view(), name="marketplace-my-requests"),
    path("marketplace/requests/<uuid:pk>/", views.ServiceRequestDetailView.as_view(), name="marketplace-request-detail"),
    path("marketplace/insights/", views.MarketplaceInsightsView.as_view(), name="marketplace-insights"),
]
