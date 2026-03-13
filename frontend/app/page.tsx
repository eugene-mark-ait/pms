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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-surface-900">
      <Navbar />
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
