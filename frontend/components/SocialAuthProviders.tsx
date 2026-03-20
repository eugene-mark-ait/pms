"use client";

/**
 * Wrapper for pages that use social login. Google is handled inside `GoogleLoginButton`
 * (it mounts its own `GoogleOAuthProvider` when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set).
 * Extend this component when adding more OAuth providers that need a shared context.
 */
export default function SocialAuthProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
