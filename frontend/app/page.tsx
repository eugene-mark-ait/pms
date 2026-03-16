"use client";

import { useEffect, useState } from "react";
import {
  Navbar,
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

  useEffect(() => {
    api
      .get<User>("/auth/me/")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-surface-900 text-surface-900 dark:text-surface-100">
      <Navbar user={user ?? undefined} />
      <main>
        <Hero />
        <PlatformOverview />
        <PropertyOwnerFeatures />
        <TenantExperience />
        <EmbeddedFinancialServices />
        <PlatformValue />
        <FinalCTA />
        <Footer />
      </main>
    </div>
  );
}
