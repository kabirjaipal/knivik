import { headers } from "next/headers"
import { getSession } from "@/lib/auth-client"
import { Hero } from "@/components/landing/hero"
import { PlatformSupport } from "@/components/landing/social-proof"
import { Workflow } from "@/components/landing/workflow"
import { ProductPreview } from "@/components/landing/product-preview"
import { Benefits } from "@/components/landing/benefits"
import { Integrations } from "@/components/landing/integrations"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/cta"

import { MetadataService } from "@/lib/seo/application/metadata.service"

export const metadata = MetadataService.constructPageMetadata({
  title: "Real-time AI-Powered Social Lead Generation",
  description: "Monitor Reddit, HackerNews, and X (Twitter) for high-intent B2B sales leads. Knivik uses state-of-the-art AI to spot potential customers in real-time.",
  path: "/",
  keywords: [
    "lead generation",
    "social listening",
    "AI sales agent",
    "Reddit monitoring",
    "Twitter leads",
    "SaaS growth",
    "HackerNews monitoring",
    "social selling tool",
    "B2B intent data"
  ]
})


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
        <FAQ />
        <FinalCTA user={user} />
      </main>
    </div>
  )
}
