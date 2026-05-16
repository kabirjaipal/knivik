import { headers } from "next/headers"
import { getSession } from "@/lib/auth-client"
import { Hero } from "@/components/landing/hero"
import { PlatformSupport } from "@/components/landing/social-proof"
import { Workflow } from "@/components/landing/workflow"
import { ProductPreview } from "@/components/landing/product-preview"
import { Benefits } from "@/components/landing/benefits"
import { Integrations } from "@/components/landing/integrations"
import { CaseStudy } from "@/components/landing/case-study"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/cta"

export const metadata = {
  title: "Knivik | AI-Powered Social Lead Generation",
  description: "Monitor Reddit, X, Hacker News, and Dev.to for high-intent leads. Knivik uses AI to find your next customers in real-time.",
  keywords: ["lead generation", "social listening", "AI sales agent", "Reddit monitoring", "Twitter leads", "SaaS growth"],
}

export default async function LandingPage() {
  const { data: session } = await getSession({
    fetchOptions: {
      headers: await headers()
    }
  })
  const user = session?.user

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="grow">
        <Hero user={user} />
        <PlatformSupport />
        <Workflow />
        <ProductPreview />
        <Benefits />
        <Integrations />
        <CaseStudy />
        <FAQ />
        <FinalCTA user={user} />
      </main>
    </div>
  )
}
