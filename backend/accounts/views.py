from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model

from .serializers import UserSerializer, UserCreateSerializer
from .social_auth import exchange_social_token_and_issue_jwt, PROVIDER_GOOGLE

User = get_user_model()


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ - returns access + refresh tokens and user."""
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class RefreshTokenView(TokenRefreshView):
    """POST /api/auth/refresh/ - returns new access token."""


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ - current user profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - register new user."""
    queryset = User.objects.all()
    serializer_class = UserCreateSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class GoogleAuthView(APIView):
    """
    POST /api/auth/google/ - exchange Google ID token for JWT.
    Body: { "id_token": "<google_id_token>" }.
    Returns same shape as login: { access, refresh, user }.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        id_token = (request.data.get("id_token") or request.data.get("idToken") or "").strip()
        if not id_token:
            return Response(
                {"detail": "id_token is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        result = exchange_social_token_and_issue_jwt(PROVIDER_GOOGLE, id_token)
        if not result:
            return Response(
                {"detail": "Invalid or expired Google token"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(result)
