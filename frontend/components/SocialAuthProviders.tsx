"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/**
 * Wraps children with providers for social login (Google, etc.).
 * Add more providers here as needed (e.g. FacebookProvider).
 */
export default function SocialAuthProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  if (GOOGLE_CLIENT_ID) {
    return (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        {children}
      </GoogleOAuthProvider>
    );
  }
  return <>{children}</>;
}
