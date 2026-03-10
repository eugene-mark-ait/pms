import {
  Navbar,
  Hero,
  Problem,
  Solution,
  FeaturesByUser,
  Benefits,
  HowItWorks,
  DashboardPreview,
  Testimonials,
  CTA,
  Footer,
} from "@/components/landing";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-surface-900">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <FeaturesByUser />
        <Benefits />
        <HowItWorks />
        <DashboardPreview />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
