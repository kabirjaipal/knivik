import { headers } from "next/headers"
import { getSession } from "@/lib/auth-client"
import { redirect } from "next/navigation"
import { Hero } from "@/components/landing/hero"
import { PlatformSupport } from "@/components/landing/social-proof"
import { Workflow } from "@/components/landing/workflow"
import { ProductPreview } from "@/components/landing/product-preview"
import { Benefits } from "@/components/landing/benefits"
import { Integrations } from "@/components/landing/integrations"
import { FAQ } from "@/components/landing/faq"
import { FinalCTA } from "@/components/landing/cta"
import { MetadataService, SchemaService, siteConfig } from "@/lib/seo"
import { SchemaScript } from "@/components/seo/schema-script"

export const metadata = MetadataService.constructPageMetadata({
  title: "Knivik | AI Lead Finder & B2B Social Lead Generation Tool",
  description: "Knivik is an advanced real-time AI Lead Finder that scans Reddit, HackerNews, X (Twitter), and Bluesky for warm sales leads with high buying intent automatically.",
  path: "/",
  keywords: siteConfig.keywords
})


export default async function LandingPage() {
  const { data: session } = await getSession({
    fetchOptions: {
      headers: await headers()
    }
  })
  const user = session?.user as { role?: string } | undefined

  if (user) {
    if (user.role === "admin") {
      redirect("/admin")
    } else {
      redirect("/dashboard")
    }
  }

  // SoftwareApplication JSON-LD schema
  const softwareSchema = SchemaService.generateSoftwareApplicationSchema({
    pricing: {
      price: "0.00",
      priceCurrency: "USD",
      availability: "https://schema.org/InStock"
    },
    features: [
      "Real-time Reddit lead finding",
      "HackerNews buyer intent tracking",
      "X (Twitter) conversational prospecting",
      "Bluesky social listening & lead generation",
      "AI-powered Warm Outreach Suggestion",
      "Semantic keyword context filtering",
      "Slack, email & webhook CRM integrations"
    ]
  });

  const websiteSchema = SchemaService.generateWebSiteSchema();
  const organizationSchema = SchemaService.generateOrganizationSchema();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <SchemaScript schema={softwareSchema} />
      <SchemaScript schema={websiteSchema} />
      <SchemaScript schema={organizationSchema} />
      <div className="grow">
        <Hero user={user} />
        <PlatformSupport />
        <Workflow />
        <ProductPreview />
        <Benefits />
        <Integrations />
        <FAQ />
        <FinalCTA user={user} />
      </div>
    </div>
  )
}
