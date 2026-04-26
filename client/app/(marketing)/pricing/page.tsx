import { Metadata } from "next";
import PricingClient from "./pricing-client";

export const metadata: Metadata = {
  title: "Simple Pricing",
  description: "Choose the perfect plan to start finding high-intent leads on Reddit and HackerNews. Start for free today and grow your business with AI social intelligence.",
  openGraph: {
    title: "Knivik Pricing - AI Social Intelligence",
    description: "Affordable plans for founders and agencies to automate lead discovery.",
  },
};

export default function PricingPage() {
  return <PricingClient />;
}
