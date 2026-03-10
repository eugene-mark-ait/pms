"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setTokens, LoginResponse } from "@/lib/api";
import SocialAuthProviders from "@/components/SocialAuthProviders";
import GoogleLoginButton from "@/components/GoogleLoginButton";
import { clsx } from "clsx";

type Role = "tenant" | "landlord" | "manager" | "caretaker";

const ROLES: { value: Role; label: string; description: string; icon: React.ReactNode }[] = [
  {
    value: "tenant",
    label: "Tenant",
    description: "Rent and manage my lease",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
  },
  {
    value: "landlord",
    label: "Landlord",
    description: "Own and list properties",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
  },
  {
    value: "manager",
    label: "Manager",
    description: "Manage properties for landlords",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 010 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.379-.138-.75-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" />
      </svg>
    ),
  },
  {
    value: "caretaker",
    label: "Caretaker",
    description: "On-site support for a property",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.47-.572.47-1.433 0-2.005L11.42 15.17zM15 10.5l-3-3M3 21v-3m0-3v3m0-3h3m-3 0H3" />
      </svg>
    ),
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("tenant");
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
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        phone: phone.trim(),
        role,
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
      <div className="min-h-screen flex items-center justify-center bg-surface-100 px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-white dark:bg-surface-800 rounded-2xl shadow-xl border border-surface-200 dark:border-surface-700 p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-center text-surface-900 dark:text-white mb-2">Create account</h1>
            <p className="text-center text-surface-600 dark:text-surface-400 mb-6">Register for Property Management</p>

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
                  <label htmlFor="firstName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">First name *</label>
                  <input id="firstName" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Last name</label>
                  <input id="lastName" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Phone number *</label>
                <input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border border-surface-300 dark:border-surface-600 bg-white dark:bg-surface-800 text-surface-900 dark:text-white" placeholder="e.g. +1234567890" />
              </div>

              <div>
                <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">I am a *</label>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value)}
                      className={clsx(
                        "flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 text-left transition",
                        role === r.value
                          ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300"
                          : "border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500 text-surface-700 dark:text-surface-300"
                      )}
                    >
                      <span className="text-surface-500 dark:text-surface-400">{r.icon}</span>
                      <span className="font-medium text-sm">{r.label}</span>
                      <span className="text-xs text-surface-500 dark:text-surface-400 hidden sm:block">{r.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">Password * (min 8 characters)</label>
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
