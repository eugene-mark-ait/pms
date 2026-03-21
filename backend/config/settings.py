"""
Django settings for Mahaliwise (property management platform).
"""

import os
from datetime import timedelta
from pathlib import Path

import environ

env = environ.Env(DEBUG=(bool, True))

BASE_DIR = Path(__file__).resolve().parent.parent

environ.Env.read_env(BASE_DIR / ".env")

SECRET_KEY = env("SECRET_KEY", default="dev-secret-key-change-in-production")
DEBUG = env("DEBUG", default=True)
ALLOWED_HOSTS = env.list(
    "ALLOWED_HOSTS", default=["localhost", "127.0.0.1", "django", "0.0.0.0"]
)


TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

INSTALLED_APPS = [
    "accounts",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "properties",
    "leases",
    "payments",
    "messaging",
    "complaints",
    "notifications",
    "vacancies",
    "marketplace",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"

DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default="postgres://pms_user:pms_secret@localhost:5432/pms_db",
    )
}

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"
    },
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

AUTH_USER_MODEL = "accounts.User"

CORS_ALLOWED_ORIGINS = env.list(
    "CORS_ALLOWED_ORIGINS",
    default=["http://localhost:3000", "http://127.0.0.1:3000", "http://nextjs:3000"],
)
CORS_ALLOW_CREDENTIALS = True

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.OptionalPageSizePagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=env.int("JWT_ACCESS_TOKEN_LIFETIME", default=60)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        minutes=env.int("JWT_REFRESH_TOKEN_LIFETIME", default=10080)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Social auth — Google: frontend uses NEXT_PUBLIC_GOOGLE_CLIENT_ID (same Web client ID);
# backend exchanges auth codes with client_id + client_secret (secret never in frontend).
GOOGLE_OAUTH2_CLIENT_ID = env("GOOGLE_OAUTH2_CLIENT_ID", default="")
GOOGLE_OAUTH2_CLIENT_SECRET = env("GOOGLE_OAUTH2_CLIENT_SECRET", default="")

# M-PESA Daraja (STK Push) — never commit real secrets; use environment only
MPESA_ENV = env("MPESA_ENV", default="sandbox")  # sandbox | production (Daraja host still forced if below is True)
MPESA_CONSUMER_KEY = env("MPESA_CONSUMER_KEY", default="")
MPESA_CONSUMER_SECRET = env("MPESA_CONSUMER_SECRET", default="")
MPESA_PASSKEY = env("MPESA_PASSKEY", default="")
MPESA_SHORTCODE = env("MPESA_SHORTCODE", default="174379")
# Public URL Safaricom can POST to, e.g. https://your-ngrok-url.ngrok.io/api/mpesa/callback/
MPESA_CALLBACK_URL = env("MPESA_CALLBACK_URL", default="")
# When True: OAuth + STK always use https://sandbox.safaricom.co.ke (avoids 404.001.03 from env mismatch).
# Set False when using live credentials + MPESA_ENV=production.
MPESA_DARAJA_FORCE_SANDBOX = env.bool("MPESA_DARAJA_FORCE_SANDBOX", default=True)
# When True: never cache OAuth token (always fetch; pairs with sandbox debugging). Default follows FORCE_SANDBOX.
MPESA_DARAJA_BYPASS_TOKEN_CACHE = env.bool(
    "MPESA_DARAJA_BYPASS_TOKEN_CACHE",
    default=MPESA_DARAJA_FORCE_SANDBOX,
)
# STK Password timestamp uses this TZ (Daraja expects Kenya local time for Lipa Na M-PESA Online).
MPESA_STK_TIMESTAMP_TZ = env("MPESA_STK_TIMESTAMP_TZ", default="Africa/Nairobi")

CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
        "LOCATION": "mahaliwise-mpesa-token",
    }
}
# FACEBOOK_APP_ID = env("FACEBOOK_APP_ID", default="")
# GITHUB_CLIENT_ID = env("GITHUB_CLIENT_ID", default="")
