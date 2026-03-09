from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404

from .serializers import UserSerializer, UserCreateSerializer, UserUpdateRolesSerializer
from .social_auth import exchange_social_token_and_issue_jwt, PROVIDER_GOOGLE
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


class UserSearchView(APIView):
    """
    GET /api/auth/users/?email= or ?search= - list users (id, email, role_names).
    Landlords and staff only; for assigning manager/caretaker/tenant.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not (request.user.is_staff or request.user.has_role("landlord")):
            return Response({"detail": "Only landlords or staff can search users."}, status=status.HTTP_403_FORBIDDEN)
        email = request.query_params.get("email", "").strip()
        search = request.query_params.get("search", "").strip()
        if not email and not search:
            return Response({"detail": "Provide email= or search= query parameter."}, status=status.HTTP_400_BAD_REQUEST)
        qs = User.objects.all().order_by("email")
        if email:
            qs = qs.filter(email__iexact=email)
        if search:
            qs = qs.filter(email__icontains=search)[:20]
        data = [
            {"id": str(u.id), "email": u.email, "role_names": list(u.roles.values_list("name", flat=True))}
            for u in qs
        ]
        return Response(data)


class AssignRolesView(APIView):
    """
    POST /api/auth/assign-roles/ - assign roles to a user.
    Body: { "user_id": "<uuid>", "role_names": ["manager", "caretaker"] }.
    Landlords can assign manager/caretaker/tenant; staff can assign any role.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
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
        if request.user.is_staff:
            # Staff can set any roles
            pass
        elif request.user.has_role("landlord"):
            # Landlord can only assign manager, caretaker, tenant (not landlord)
            allowed = {"manager", "caretaker", "tenant"}
            if not set(role_names).issubset(allowed):
                return Response(
                    {"detail": "Landlords can only assign manager, caretaker, or tenant roles."},
                    status=status.HTTP_403_FORBIDDEN,
                )
        else:
            return Response(
                {"detail": "Only landlords or staff can assign roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        roles = list(Role.objects.filter(name__in=role_names))
        target.roles.set(roles)
        return Response(UserSerializer(target).data)


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
