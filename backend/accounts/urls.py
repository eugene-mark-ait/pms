from django.urls import path
from rest_framework_simplejwt.views import TokenBlacklistView

from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="token_obtain_pair"),
    path("refresh/", views.RefreshTokenView.as_view(), name="token_refresh"),
    path("logout/", TokenBlacklistView.as_view(), name="token_blacklist"),
    path("me/", views.CurrentUserView.as_view(), name="current_user"),
    path("register/", views.RegisterView.as_view(), name="register"),
    # Social login (JWT flow after validation)
    path("google/", views.GoogleAuthView.as_view(), name="google_auth"),
]
