"use client";

import { useCallback, useState } from "react";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { api, setTokens, LoginResponse } from "@/lib/api";

/** Web client ID from Google Cloud. Popup app name = OAuth consent screen "App name" (set to Mahaliwise in GCP), not this file. See docs/GOOGLE_OAUTH_BRANDING.md */
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  /** Fires when Google returns a code and we are exchanging it with your API (until redirect or error). */
  onBusyChange?: (busy: boolean) => void;
  disabled?: boolean;
  className?: string;
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
}

function buttonClasses(theme: GoogleLoginButtonProps["theme"], size: GoogleLoginButtonProps["size"]): string {
  const sizeCls =
    size === "small"
      ? "px-3 py-1.5 text-xs"
      : size === "medium"
        ? "px-4 py-2 text-sm"
        : "px-4 py-2.5 text-sm";
  if (theme === "filled_blue") {
    return `${sizeCls} rounded-lg bg-[#4285F4] text-white border border-transparent hover:bg-[#3367d6] font-medium`;
  }
  if (theme === "filled_black") {
    return `${sizeCls} rounded-lg bg-surface-900 dark:bg-surface-100 text-white dark:text-surface-900 border border-transparent hover:opacity-90 font-medium`;
  }
  return `${sizeCls} rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-800 dark:text-surface-100 hover:bg-surface-50 dark:hover:bg-surface-700 font-medium`;
}

/** No hooks — safe when client ID is missing. */
function GoogleLoginDisabled({ className }: { className?: string }) {
  return (
    <div className={className}>
      <button
        type="button"
        disabled
        className="w-full max-w-[280px] flex items-center justify-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 px-4 py-2.5 text-sm text-surface-500 dark:text-surface-400 cursor-not-allowed"
        title="Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local (must match backend GOOGLE_OAUTH2_CLIENT_ID). Backend also needs GOOGLE_OAUTH2_CLIENT_SECRET."
      >
        Sign in with Google (not configured)
      </button>
    </div>
  );
}

/** Must render only inside GoogleOAuthProvider. */
function Spinner({ className }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 animate-spin rounded-full border-2 border-surface-300 border-t-primary-600 dark:border-surface-600 dark:border-t-primary-400 ${className ?? "h-5 w-5"}`}
      aria-hidden
    />
  );
}

function GoogleLoginButtonInner({
  onSuccess,
  onError,
  onBusyChange,
  disabled,
  className,
  theme = "outline",
  size = "large",
}: GoogleLoginButtonProps) {
  const [completingSignIn, setCompletingSignIn] = useState(false);

  const handleCode = useCallback(
    async (code: string | undefined) => {
      if (!code) {
        onError?.("No authorization code from Google");
        return;
      }
      setCompletingSignIn(true);
      onBusyChange?.(true);
      try {
        const { data } = await api.post<LoginResponse>("/auth/google/", { code });
        setTokens(data.access, data.refresh);
        onSuccess?.();
      } catch (err: unknown) {
        setCompletingSignIn(false);
        onBusyChange?.(false);
        const ax = err as { response?: { data?: { detail?: string } } };
        const msg = ax.response?.data?.detail || "Google sign-in failed";
        onError?.(msg);
      }
    },
    [onSuccess, onError, onBusyChange],
  );

  const login = useGoogleLogin({
    flow: "auth-code",
    onSuccess: (codeResponse) => {
      void handleCode(codeResponse.code);
    },
    onError: () => {
      setCompletingSignIn(false);
      onBusyChange?.(false);
      onError?.("Google sign-in was cancelled or failed");
    },
  });

  const baseBtn = `w-full max-w-[280px] inline-flex items-center justify-center gap-2 ${buttonClasses(theme, size)} disabled:opacity-50 disabled:cursor-not-allowed`;
  const btnBlocked = Boolean(disabled || completingSignIn);

  return (
    <div
      className={className}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <button
        type="button"
        disabled={btnBlocked}
        onClick={() => login()}
        className={baseBtn}
        aria-busy={completingSignIn}
      >
        {completingSignIn ? (
          <>
            <Spinner />
            Signing you in…
          </>
        ) : (
          <>
            <GoogleGIcon />
            Sign in with Google
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Sign in with Google (auth-code flow). Self-wraps with GoogleOAuthProvider when configured
 * so it works even if a parent omits the provider (e.g. SocialAuthProviders without env).
 */
export default function GoogleLoginButton(props: GoogleLoginButtonProps) {
  if (!GOOGLE_CLIENT_ID) {
    return <GoogleLoginDisabled className={props.className} />;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <GoogleLoginButtonInner {...props} />
    </GoogleOAuthProvider>
  );
}

function GoogleGIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}
