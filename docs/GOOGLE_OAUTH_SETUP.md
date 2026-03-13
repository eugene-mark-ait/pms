# Google Sign-In ("Not connected") Fix

If the **Sign in with Google** button shows **"Not connected"** or fails to load, the message comes from **Google**, not this app. It means your app’s URL is not allowed for the OAuth client.

## Fix: Add your origin in Google Cloud Console

1. Open [Google Cloud Console](https://console.cloud.google.com/) and select your project (or create one).
2. Go to **APIs & Services** → **Credentials**.
3. Open your **OAuth 2.0 Client ID** of type **Web application** (the one whose Client ID you use in `NEXT_PUBLIC_GOOGLE_CLIENT_ID`).
4. Under **Authorized JavaScript origins**, add **every** URL where the frontend runs, for example:
   - Local dev: `http://localhost:3000` (and `http://127.0.0.1:3000` if you use that)
   - If Next.js runs on another port: `http://localhost:3001`, etc.
   - Production: `https://yourdomain.com` (no trailing slash)
5. **Save** the credentials.

Changes can take a few minutes to apply. Refresh the app and try again.

## Checklist

- [ ] Client ID type is **Web application** (not Desktop / Android).
- [ ] **Authorized JavaScript origins** includes the exact origin (scheme + host + port, no path). Examples:
  - `http://localhost:3000`
  - `https://pms.example.com`
- [ ] **Authorized redirect URIs**: not required for the ID-token flow used here; only needed if you add server-side OAuth later.
- [ ] OAuth consent screen: if the app is in **Testing** mode, add the Google accounts you use as **Test users**.

## Backend

- Backend uses the same Client ID (in `GOOGLE_OAUTH2_CLIENT_ID`) only to **verify** the ID token. No redirect URI or Client Secret is required for that flow.
