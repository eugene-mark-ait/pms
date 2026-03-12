"use client";

import { useCallback } from "react";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { api, setTokens, LoginResponse } from "@/lib/api";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
}

export default function GoogleLoginButton({
  onSuccess,
  onError,
  disabled,
  className,
  theme = "outline",
  size = "large",
}: GoogleLoginButtonProps) {
  const handleCredentialResponse = useCallback(
    async (credentialResponse: CredentialResponse) => {
      const credential = credentialResponse.credential;
      if (!credential) {
        onError?.("No credential from Google");
        return;
      }

      try {
        const { data } = await api.post<LoginResponse>("/auth/google/", {
          id_token: credential,
        });

        setTokens(data.access, data.refresh);
        onSuccess?.();
      } catch (err: unknown) {
        const ax = err as { response?: { data?: { detail?: string } } };
        const msg = ax.response?.data?.detail || "Google sign-in failed";
        onError?.(msg);
      }
    },
    [onSuccess, onError],
  );

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className={className}>
        <button
          type="button"
          disabled
          className="w-full max-w-[240px] flex items-center justify-center gap-2 rounded-lg border border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-700 px-4 py-2.5 text-sm text-surface-500 dark:text-surface-400 cursor-not-allowed"
          title="Add NEXT_PUBLIC_GOOGLE_CLIENT_ID to .env.local and restart the dev server"
        >
          Sign in with Google (not configured)
        </button>
      </div>
    );
  }

  return (
    <div
      className={className}
      style={{
        pointerEvents: disabled ? "none" : "auto",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <GoogleLogin
        onSuccess={handleCredentialResponse}
        onError={() => onError?.("Google sign-in was cancelled or failed")}
        useOneTap={false}
        theme={theme}
        size={size}
        text="signin_with"
        shape="rectangular"
      />
    </div>
  );
}
