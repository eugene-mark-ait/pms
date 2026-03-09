"""
Scalable social login: verify provider token, get_or_create user, issue JWT.
Add new providers by implementing verify_<provider> and registering in SOCIAL_PROVIDERS.
"""
import logging
from typing import Any

from django.conf import settings
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, UserSocialAuth
from .serializers import UserSerializer

logger = logging.getLogger(__name__)

# Provider identifiers (must match UserSocialAuth.Provider)
PROVIDER_GOOGLE = "google"
# PROVIDER_FACEBOOK = "facebook"
# PROVIDER_GITHUB = "github"


def _issue_jwt_response(user: User) -> dict[str, Any]:
    """Return same shape as email login: { access, refresh, user }."""
    refresh = RefreshToken.for_user(user)
    return {
        "access": str(refresh.access_token),
        "refresh": str(refresh),
        "user": UserSerializer(user).data,
    }


def verify_google_id_token(id_token: str) -> dict[str, Any] | None:
    """
    Verify Google OAuth2 ID token and return payload (email, sub, given_name, family_name).
    Returns None if invalid. Requires GOOGLE_OAUTH2_CLIENT_ID in settings (or env).
    """
    try:
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests
    except ImportError:
        logger.exception("google-auth not installed")
        return None

    client_id = getattr(
        settings,
        "GOOGLE_OAUTH2_CLIENT_ID",
        None,
    ) or getattr(settings, "SOCIAL_AUTH_GOOGLE_OAUTH2_KEY", None)
    if not client_id:
        logger.warning("GOOGLE_OAUTH2_CLIENT_ID not set; Google login will fail")
        return None

    try:
        payload = id_token.verify_oauth2_token(
            id_token,
            google_requests.Request(),
            client_id,
        )
        if not payload.get("email"):
            logger.warning("Google payload missing email")
            return None
        return payload
    except Exception as e:
        logger.warning("Google id_token verification failed: %s", e)
        return None


# Registry: provider_id -> verifier(id_token_or_access_token) -> payload or None
def _verifier_google(token: str) -> dict[str, Any] | None:
    return verify_google_id_token(token)


SOCIAL_VERIFIERS: dict[str, callable] = {
    PROVIDER_GOOGLE: _verifier_google,
    # "facebook": _verifier_facebook,
    # "github": _verifier_github,
}


def get_or_create_user_from_social(
    provider: str,
    provider_user_id: str,
    email: str,
    *,
    first_name: str = "",
    last_name: str = "",
    extra_data: dict | None = None,
) -> User:
    """
    Get existing user by social link or email; create if new.
    Links UserSocialAuth for the provider so the same account can be used next time.
    """
    email = User.objects.normalize_email(email)
    # Prefer existing link for this provider
    social = UserSocialAuth.objects.filter(
        provider=provider,
        provider_user_id=provider_user_id,
    ).select_related("user").first()

    if social:
        user = social.user
        # Optionally update name from provider
        if first_name and not user.first_name:
            user.first_name = first_name[:150]
        if last_name and not user.last_name:
            user.last_name = last_name[:150]
        if (first_name or last_name) and (user.first_name or user.last_name):
            user.save(update_fields=["first_name", "last_name", "updated_at"])
        return user

    # No social link: get by email or create
    user = User.objects.filter(email=email).first()
    if user:
        # Link this provider to existing account
        UserSocialAuth.objects.get_or_create(
            provider=provider,
            provider_user_id=provider_user_id,
            defaults={"user": user, "extra_data": extra_data or {}},
        )
        if first_name and not user.first_name:
            user.first_name = first_name[:150]
        if last_name and not user.last_name:
            user.last_name = last_name[:150]
        if (first_name or last_name) and (user.first_name or user.last_name):
            user.save(update_fields=["first_name", "last_name", "updated_at"])
        return user

    # New user
    user = User.objects.create_user(
        email=email,
        password=None,
        first_name=(first_name or "")[:150],
        last_name=(last_name or "")[:150],
    )
    UserSocialAuth.objects.create(
        user=user,
        provider=provider,
        provider_user_id=provider_user_id,
        extra_data=extra_data or {},
    )
    return user


def exchange_social_token_and_issue_jwt(
    provider: str,
    token: str,
) -> dict[str, Any] | None:
    """
    Verify provider token, get or create user, return JWT response.
    Returns None if verification fails (caller should return 400).
    """
    verifier = SOCIAL_VERIFIERS.get(provider)
    if not verifier:
        return None
    payload = verifier(token)
    if not payload:
        return None

    # Normalize payload fields (Google: email, sub, given_name, family_name)
    email = (payload.get("email") or "").strip()
    if not email:
        return None
    provider_user_id = str(payload.get("sub") or payload.get("id") or "")
    if not provider_user_id:
        return None
    first_name = (payload.get("given_name") or payload.get("name") or "").strip()[:150]
    last_name = (payload.get("family_name") or "").strip()[:150]
    if not last_name and " " in (payload.get("name") or ""):
        parts = (payload.get("name") or "").strip().split(None, 1)
        first_name = (parts[0] or first_name)[:150]
        last_name = (parts[1] or "")[:150]

    user = get_or_create_user_from_social(
        provider=provider,
        provider_user_id=provider_user_id,
        email=email,
        first_name=first_name,
        last_name=last_name,
        extra_data=payload,
    )
    return _issue_jwt_response(user)
