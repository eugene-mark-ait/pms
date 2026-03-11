import {
  Navbar,
  Hero,
  Benefits,
  FeaturesByUser,
  HowItWorks,
  MpesaRentSection,
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
        <Benefits />
        <MpesaRentSection />
        <FeaturesByUser />
        <HowItWorks />
        <DashboardPreview />
        <Testimonials />
        <CTA />
        <Footer />
      </main>
    </div>
  );
}
