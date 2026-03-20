# Google Sign-In shows the wrong app name (e.g. "PMS")

The **Google account chooser and consent screen title** come from your **Google Cloud project**, not from this repository.

## Change the name to Mahaliwise

1. Open [Google Cloud Console](https://console.cloud.google.com/) → select the project used for your OAuth Web client.
2. Go to **APIs & Services** → **OAuth consent screen**.
3. Set **App name** to **Mahaliwise** (and update logo/support email if needed).
4. Save. Changes apply to new sign-in flows (users may need to clear cached consent).

Your Next.js `metadata.title` and UI copy can say Mahaliwise, but Google will keep showing the old name until the consent screen is updated there.

## Related env vars

- Frontend: `NEXT_PUBLIC_GOOGLE_CLIENT_ID` (Web client ID)
- Backend: `GOOGLE_OAUTH2_CLIENT_ID`, `GOOGLE_OAUTH2_CLIENT_SECRET` (same Web client; secret server-only)
