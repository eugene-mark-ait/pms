# PMS – Property Management Platform (MVP)

Production-quality MVP for a multi-tenant SaaS Property Management Platform.

## Tech stack

- **Backend:** Python, Django, Django REST Framework, PostgreSQL, JWT (Simple JWT), Docker
- **Frontend:** Next.js 14 (TypeScript), Tailwind CSS, App Router
- **Architecture:** Monorepo with `backend` (Django API) and `frontend` (Next.js)

## Quick start with Docker

```bash
# From repo root
docker compose up --build
```

- **API:** http://localhost:8000/api/
- **Frontend:** http://localhost:3000
- **Django admin:** http://localhost:8000/admin/ (create superuser first)

### First-time setup (create superuser and roles)

```bash
docker compose exec django python manage.py createsuperuser --email admin@example.com
# Roles are created automatically on startup via seed_roles
```

## Project structure

```
pms/
├── backend/                 # Django API
│   ├── config/              # Django settings, urls, wsgi
│   ├── accounts/            # Custom User, Role, JWT auth
│   ├── properties/          # Property, Unit, ManagerAssignment, PropertyRule
│   ├── leases/              # Lease, TenantProfile, give-notice, my-units
│   ├── payments/            # Payment, pay-rent, history
│   ├── messaging/           # Message
│   ├── complaints/          # Complaint
│   ├── notifications/       # Notification
│   ├── vacancies/           # VacateNotice, VacancyListing
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/                # Next.js app
│   ├── app/
│   │   ├── (app)/           # Dashboard layout: dashboard, properties, units, tenants, payments, vacancies, complaints, messages, settings
│   │   ├── login/
│   │   └── register/
│   ├── components/          # PayRentModal, GiveNoticeModal, DashboardLayout
│   ├── lib/api.ts           # Axios client, JWT, types
│   ├── middleware.ts       # Route protection (session cookie)
│   └── package.json
├── docker-compose.yml       # django, postgres, nextjs
└── README.md
```

## Authentication (JWT)

- **Login:** `POST /api/auth/login/` → `{ access, refresh, user }`
- **Refresh:** `POST /api/auth/refresh/` with `{ refresh }` → `{ access }`
- **Logout:** `POST /api/auth/logout/` (blacklist refresh token)
- **Me:** `GET /api/auth/me/` (requires Bearer token)
- **Google (social):** `POST /api/auth/google/` with `{ id_token }` → same as login (`{ access, refresh, user }`)

Django validates JWT via `rest_framework_simplejwt.authentication.JWTAuthentication`. Next.js stores tokens in localStorage and sets a `pms_session` cookie for middleware route protection.

### Social login (scalable)

Social logins (Google first) use the **same JWT flow** after provider validation:

1. User signs in with Google on the frontend (Google Identity / `@react-oauth/google`).
2. Frontend sends the Google **id_token** to `POST /api/auth/google/`.
3. Backend verifies the id_token with Google, then **get_or_create** user by email (or by existing `UserSocialAuth` link), and issues **access + refresh** tokens as for email login.
4. Frontend stores tokens and redirects to the dashboard.

To add more providers (e.g. Facebook, GitHub): implement a verifier in `accounts/social_auth.py` (e.g. `verify_facebook_token`), register it in `SOCIAL_VERIFIERS`, add a view and URL (e.g. `POST /api/auth/facebook/`), and add a button + provider wrapper on the frontend (e.g. `FacebookLoginButton` + env for `FACEBOOK_APP_ID`).

## API endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login/` | Login (access + refresh + user) |
| POST | `/api/auth/google/` | Google: exchange id_token for JWT (same response as login) |
| POST | `/api/auth/refresh/` | Refresh access token |
| GET | `/api/auth/me/` | Current user |
| GET | `/api/properties/` | List properties (landlord/manager) |
| GET | `/api/properties/:id/` | Property detail |
| GET | `/api/units/` | List units (?property=uuid) |
| GET/POST | `/api/leases/` | List/create leases |
| GET | `/api/tenant/my-units/` | Tenant: my active leases (with rent info) |
| POST | `/api/leases/give-notice/` | Tenant: submit vacate notice (body: lease_id, move_out_date, reason?, notice_message?) |
| POST | `/api/payments/pay-rent/` | Tenant: pay rent (body: lease_id, months 1–3, payment_method) |
| GET | `/api/payments/history/` | Tenant: payment history |
| GET | `/api/payments/` | List payments (role-based) |
| GET | `/api/vacancies/` | Upcoming vacancies (landlord/manager) |
| GET/POST | `/api/complaints/` | List/create complaints |
| GET/POST | `/api/messages/` | List/send messages |
| GET | `/api/notifications/` | List notifications |

## Roles and permissions

- **Landlord:** Create properties, add units, assign managers, view payments and tenant credit, view vacancies and complaints.
- **Manager:** Manage assigned properties, add tenants, track payments, handle complaints.
- **Caretaker:** View complaints, communicate with tenants.
- **Tenant:** View lease, rent balance, pay rent (1–3 months), give notice, complaints, messages.

A user can have multiple roles (e.g. landlord and tenant).

## Database (PostgreSQL)

- UUID primary keys on all main models.
- Multi-tenant: data scoped by landlord / manager assignment / tenant.
- **Payment:** `months_paid_for`, `period_start`, `period_end`, `payment_status`.
- **Lease:** `monthly_rent`, `deposit_amount`, `deposit_paid`.
- Rent tracking: next due date and balance derived from last completed payment.

## Frontend (Next.js)

- **Routes:** `/login`, `/register`, `/dashboard`, `/dashboard/my-units`, `/properties`, `/properties/[id]`, `/units`, `/tenants`, `/payments`, `/vacancies`, `/complaints`, `/messages`, `/settings`.
- **Tenant “My Units”:** Unit cards with property, unit number, monthly rent, deposit status, last/next payment, balance, status (Paid/Due/Overdue), **Pay Rent** and **Give Notice** buttons.
- **Pay Rent modal:** Select 1–3 months, payment method; total = monthly_rent × months; calls `POST /api/payments/pay-rent/`.
- **Give Notice:** Move-out date, optional reason and message; creates VacateNotice and VacancyListing, notifies landlord/manager.

## Running without Docker

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate   # or source .venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL (e.g. postgres://pms_user:pms_secret@localhost:5432/pms_db)
python manage.py migrate
python manage.py seed_roles
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm ci
# Set NEXT_PUBLIC_API_URL=http://localhost:8000 (optional; default is used)
npm run dev
```

## Environment variables

- **Backend (Django):** `SECRET_KEY`, `DEBUG`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`, `JWT_ACCESS_TOKEN_LIFETIME`, `JWT_REFRESH_TOKEN_LIFETIME`, `GOOGLE_OAUTH2_CLIENT_ID` (required for Google login)
- **Postgres:** `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- **Frontend:** `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`), `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (same as backend Google client ID for the web app)

**Google OAuth:** Create a OAuth 2.0 Client ID (Web application) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials). Set the authorized JavaScript origins (e.g. `http://localhost:3000`). Use the same Client ID for both `GOOGLE_OAUTH2_CLIENT_ID` (Django) and `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Next.js).

## Validation (business rules)

- Tenant cannot pay for more than 3 months at once.
- Payment amount must be greater than zero.
- Tenant cannot submit vacate notice without an active lease.
