"use client";

import { useEffect, useState } from "react";
import {
  Navbar,
  WelcomeBack,
  Hero,
  PlatformOverview,
  PropertyOwnerFeatures,
  TenantExperience,
  EmbeddedFinancialServices,
  PlatformValue,
  FinalCTA,
  Footer,
} from "@/components/landing";
import { api, User } from "@/lib/api";

export default function LandingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    api
      .get<User>("/auth/me/")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  const showLoggedInView = authChecked && user;

  return (
    <div className="min-h-screen bg-white text-surface-900">
      <Navbar user={user ?? undefined} />
      <main>
        {showLoggedInView ? (
          <>
            <WelcomeBack user={user} />
            <Footer />
          </>
        ) : (
          <>
            <Hero />
            <PlatformOverview />
            <PropertyOwnerFeatures />
            <TenantExperience />
            <EmbeddedFinancialServices />
            <PlatformValue />
            <FinalCTA />
            <Footer />
          </>
        )}
      </main>
    </div>
  );
}
