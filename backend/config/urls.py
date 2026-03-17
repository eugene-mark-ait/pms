from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("properties.urls")),
    path("api/", include("leases.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("messaging.urls")),
    path("api/", include("complaints.urls")),
    path("api/", include("notifications.urls")),
    path("api/", include("vacancies.urls")),
    path("api/", include("marketplace.urls")),
]
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
