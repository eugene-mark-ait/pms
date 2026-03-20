# Google Sign-In setup

Sign-in uses the **authorization code** flow: the browser gets a short-lived `code`, and the **backend** exchanges it at Google’s token endpoint using **Client ID + Client Secret**. The secret **never** goes in the frontend or in any `NEXT_PUBLIC_*` variable.

## Environment variables

| Where | Variable | Purpose |
|--------|-----------|---------|
| **Frontend** (`.env.local`) | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Same **Web client** ID as below; used by Sign-In with Google JS. |
| **Backend** (`.env`) | `GOOGLE_OAUTH2_CLIENT_ID` | Same value as `NEXT_PUBLIC_GOOGLE_CLIENT_ID`. |
| **Backend** (`.env`) | `GOOGLE_OAUTH2_CLIENT_SECRET` | From the same OAuth client; **server only**. |

If the secret is missing, `POST /api/auth/google/` returns **503** with a clear message.

## Google Cloud Console

1. [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services** → **Credentials**.
2. Create or open an **OAuth 2.0 Client ID** of type **Web application**.
3. **Authorized JavaScript origins** — add every frontend origin (no path, no trailing slash), e.g.:
   - `http://localhost:3000`
   - `https://yourdomain.com`
4. Copy **Client ID** into both `NEXT_PUBLIC_GOOGLE_CLIENT_ID` and `GOOGLE_OAUTH2_CLIENT_ID`.
5. Copy **Client secret** into `GOOGLE_OAUTH2_CLIENT_SECRET` on the backend only.

For the code model used here, you typically **do not** need to add `postmessage` as a redirect URI (see [Use code model](https://developers.google.com/identity/oauth2/web/guides/use-code-model)).

## Checklist

- [ ] Client type is **Web application**.
- [ ] Frontend and backend **Client ID** values match.
- [ ] **Client secret** is set only in backend `.env`.
- [ ] OAuth consent screen: in **Testing**, add test users as needed.

## Troubleshooting (“Not connected” / popup issues)

That message usually means the current **origin** is missing under **Authorized JavaScript origins**. Add the exact scheme + host + port, save, wait a minute, and retry.

## API

- `POST /api/auth/google/`  
  - Body: `{ "code": "<authorization_code>" }`  
  - Response: `{ access, refresh, user }` (same shape as password login).
