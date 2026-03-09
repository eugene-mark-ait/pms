"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api, setTokens, LoginResponse } from "@/lib/api";
import SocialAuthProviders from "@/components/SocialAuthProviders";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login/", {
        email,
        password,
      });
      setTokens(data.access, data.refresh);
      router.push(from);
      router.refresh();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { detail?: string } } };
      setError(ax.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSuccess() {
    router.push(from);
    router.refresh();
  }

  return (
    <SocialAuthProviders>
      <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-8">
            <h1 className="text-2xl font-bold text-center text-surface-900 dark:text-white mb-2">
              Property Management
            </h1>
            <p className="text-center text-surface-600 dark:text-surface-400 mb-8">
              Sign in to your account
            </p>

            {/* Social login first (scalable: add more providers here) */}
            <div className="flex justify-center mb-6">
              <GoogleLoginButton
                onSuccess={handleGoogleSuccess}
                onError={setError}
                disabled={loading}
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-surface-800 text-surface-500">
                  or continue with email
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg p-3">
                  {error}
                </div>
              )}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-primary-600 hover:underline">
                Register
              </a>
            </p>
          </div>
        </div>
      </div>
    </SocialAuthProviders>
  );
}
