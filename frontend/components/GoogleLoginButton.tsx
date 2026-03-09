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

  if (!GOOGLE_CLIENT_ID) return null;

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
