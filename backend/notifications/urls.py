from django.urls import path
from . import views

urlpatterns = [
    path("notifications/", views.NotificationListView.as_view(), name="notification-list"),
    path("notifications/<uuid:pk>/", views.NotificationDetailView.as_view(), name="notification-detail"),
]
