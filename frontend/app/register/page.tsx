"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setTokens, LoginResponse } from "@/lib/api";
import SocialAuthProviders from "@/components/SocialAuthProviders";
import GoogleLoginButton from "@/components/GoogleLoginButton";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/register/", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      const { data } = await api.post<LoginResponse>("/auth/login/", { email, password });
      setTokens(data.access, data.refresh);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: Record<string, string[]> } };
      const msg = ax.response?.data;
      const first = msg && typeof msg === "object" && Object.values(msg).flat().length
        ? (Object.values(msg).flat() as string[])[0]
        : "Registration failed";
      setError(first);
    } finally {
      setLoading(false);
    }
  }

  function handleGoogleSuccess() {
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <SocialAuthProviders>
      <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-8">
            <h1 className="text-2xl font-bold text-center text-surface-900 dark:text-white mb-2">Create account</h1>
            <p className="text-center text-surface-600 dark:text-surface-400 mb-8">Register for Property Management</p>

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
                <span className="px-2 bg-white dark:bg-surface-800 text-surface-500">or register with email</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg p-3">
                {error}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">First name</label>
                <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Last name</label>
                <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white" />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Password</label>
              <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-2.5 px-4 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-medium rounded-lg transition">
              {loading ? "Creating account…" : "Register"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-surface-600 dark:text-surface-400">
            Already have an account? <a href="/login" className="text-primary-600 hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
    </SocialAuthProviders>
  );
}
