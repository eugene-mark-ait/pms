import {
  Navbar,
  Footer,
} from "@/components/landing";
import PricingContent from "@/components/landing/PricingContent";

export const metadata = {
  title: "Pricing | PMS – Property Management",
  description: "Simple per-unit pricing for landlords. Tenants and property managers use the platform for free.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-surface-900">
      <Navbar />
      <main className="pt-20">
        <PricingContent />
      </main>
      <Footer />
    </div>
  );
}
