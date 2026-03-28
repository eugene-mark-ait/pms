from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers as drf_serializers
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer, TokenRefreshSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .serializers import UserSerializer, UserCreateSerializer, UserUpdateRolesSerializer, ChooseRoleSerializer
from .social_auth import exchange_google_code_and_issue_jwt
from .models import Role

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


class SafeTokenRefreshSerializer(TokenRefreshSerializer):
    """Refresh serializer that handles missing/deleted users without raising 500."""

    def validate(self, attrs):
        try:
            return super().validate(attrs)
        except User.DoesNotExist:
            raise drf_serializers.ValidationError({"detail": "Invalid or expired refresh token"})


class RefreshTokenView(TokenRefreshView):
    """POST /api/auth/refresh/ - returns new access token. Fails gracefully if user no longer exists."""
    serializer_class = SafeTokenRefreshSerializer


class CurrentUserView(generics.RetrieveUpdateAPIView):
    """GET/PATCH /api/auth/me/ - current user profile."""
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - register new user (step 1; role chosen in step 2)."""
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


class ChooseRoleView(APIView):
    """POST /api/auth/choose-role/ - set role for current user (step 2 after register or OAuth). User must be authenticated and have no role yet (or replace)."""
    permission_classes = [IsAuthenticated]
    serializer_class = ChooseRoleSerializer

    def post(self, request):
        serializer = ChooseRoleSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_name = serializer.validated_data["role"]
        role, _ = Role.objects.get_or_create(name=role_name)
        request.user.roles.set([role])
        if role_name == "tenant":
            from payments.flutterwave.customers import ensure_flutterwave_customer

            ensure_flutterwave_customer(request.user)
        return Response(UserSerializer(request.user).data)


class UserSearchView(APIView):
    """
    GET /api/auth/users/?email= or ?search= - list users (id, email, role_names).
    Property owners and staff only; for assigning manager/caretaker/tenant.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (
            request.user.is_staff
            or request.user.has_role("property_owner")
            or request.user.has_role("manager")
            or request.user.has_role("caretaker")
        ):
            return Response(
                {"detail": "Only property owners, managers, caretakers or staff can search users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        email = request.query_params.get("email", "").strip()
        search = request.query_params.get("search", "").strip()
        phone = request.query_params.get("phone", "").strip()
        if not email and not search and not phone:
            return Response(
                {"detail": "Provide email=, search=, or phone= query parameter."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        qs = User.objects.all().order_by("email")
        if phone:
            # Normalize: digits only for lookup so 0712345678 matches +254712345678
            digits = "".join(c for c in phone if c.isdigit())
            if digits:
                from django.db.models import Q
                qs = qs.filter(
                    Q(phone__icontains=digits[-9:])  # last 9 digits (local number)
                    | Q(phone__icontains=digits)
                )[:20]
            else:
                qs = qs.none()
        elif email:
            qs = qs.filter(email__iexact=email)
        elif search:
            qs = qs.filter(email__icontains=search)[:20]
        data = [
            {
                "id": str(u.id),
                "email": u.email,
                "first_name": getattr(u, "first_name", "") or "",
                "last_name": getattr(u, "last_name", "") or "",
                "phone": getattr(u, "phone", "") or "",
                "role_names": list(u.roles.values_list("name", flat=True)),
            }
            for u in qs
        ]
        return Response(data)


class AssignRolesView(APIView):
    """
    POST /api/auth/assign-roles/ - assign roles to a user.
    Body: { "user_id": "<uuid>", "role_names": ["manager", "caretaker", ...] }.
    Only staff can assign roles; property owners cannot assign roles.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_staff:
            return Response(
                {"detail": "Only staff can assign roles to users."},
                status=status.HTTP_403_FORBIDDEN,
            )
        user_id = request.data.get("user_id")
        if not user_id:
            return Response(
                {"detail": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = UserUpdateRolesSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role_names = serializer.validated_data["role_names"]
        target = get_object_or_404(User, pk=user_id)
        roles = list(Role.objects.filter(name__in=role_names))
        target.roles.set(roles)
        return Response(UserSerializer(target).data)


class GoogleAuthView(APIView):
    """
    POST /api/auth/google/ - exchange Google authorization code for JWT.
    Body: { "code": "<auth_code>" } from Sign-In with Google (auth-code flow).
    Backend uses GOOGLE_OAUTH2_CLIENT_ID + GOOGLE_OAUTH2_CLIENT_SECRET (secret never on frontend).
    Returns same shape as login: { access, refresh, user }.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.conf import settings as dj_settings

        code = (request.data.get("code") or "").strip()
        if not code:
            return Response(
                {"detail": "code is required (use Google auth-code flow from the client)."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not getattr(dj_settings, "GOOGLE_OAUTH2_CLIENT_ID", None):
            return Response(
                {"detail": "Google OAuth is not configured (GOOGLE_OAUTH2_CLIENT_ID)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if not (getattr(dj_settings, "GOOGLE_OAUTH2_CLIENT_SECRET", None) or "").strip():
            return Response(
                {"detail": "Google OAuth client secret is not configured (GOOGLE_OAUTH2_CLIENT_SECRET)."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        result = exchange_google_code_and_issue_jwt(code)
        if not result:
            return Response(
                {"detail": "Invalid or expired Google authorization code"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(result)
