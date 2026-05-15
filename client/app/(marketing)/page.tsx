import { Metadata } from "next"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Problem } from "@/components/landing/problem"
import { Workflow } from "@/components/landing/workflow"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/cta"

export const metadata: Metadata = {
  title: "Knivik | Autonomous Social Media Lead Generation",
  description: "Find high-intent leads on Reddit, X, and HackerNews autonomously. Knivik uses AI to monitor real-time conversations and find your next customers.",
  keywords: ["lead generation", "social listening", "AI sales agent", "Reddit monitoring", "Twitter leads", "SaaS growth"],
  openGraph: {
    title: "Knivik | Autonomous Social Media Lead Generation",
    description: "Scale your sales pipeline on autopilot. Find leads where they talk.",
    url: "https://knivik.com",
    siteName: "Knivik",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Knivik | Find Leads on Autopilot",
    description: "24/7 autonomous social listening for high-growth teams.",
  },
  alternates: {
    canonical: "https://knivik.com",
  },
}

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Knivik",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Autonomous AI sales agent for social media lead generation.",
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "128"
            }
          }),
        }}
      />
      <Hero />
      <Problem />
      <Workflow />
      <Features />
      <FAQ />
      <FinalCTA />
    </main>
  )
}
