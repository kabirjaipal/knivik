import { PROJECT_NAME } from "@/lib/constants"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Read the terms of service for ${PROJECT_NAME}. Understand your rights and responsibilities when using our AI social intelligence platform.`,
};

export default function TermsPage() {
  return (
    <main className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Terms of Service</h1>
          <p className="text-muted-foreground text-lg">Last Updated: April 26, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 leading-relaxed text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">1. Acceptance of Terms</h2>
            <p>
              By accessing or using {PROJECT_NAME}, you agree to be bound by these Terms of Service. If you do not agree to all of these terms, do not use our services.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">2. Description of Service</h2>
            <p>
              {PROJECT_NAME} provides AI-driven social listening and market intelligence tools. We scan the public web (including community forums and social platforms) to analyze market trends, community sentiment, and intent signals based on your target keywords.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">3. User Responsibility</h2>
            <p>
              You are responsible for maintaining the security of your account and for all activities that occur under the account. You agree not to use {PROJECT_NAME} for any illegal or unauthorized purpose, including spamming or violating the terms of service of third-party platforms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">4. Intellectual Property</h2>
            <p>
              The service and its original content, features, and functionality are and will remain the exclusive property of {PROJECT_NAME} and its licensors.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">5. Termination</h2>
            <p>
              We may terminate or suspend access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">6. Limitation of Liability</h2>
            <p>
              In no event shall {PROJECT_NAME}, nor its directors, employees, or partners, be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">7. Payments and Billing</h2>
            <p>
              Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders. Paddle handles all customer service inquiries and returns. By placing an order, you agree to Paddle's Terms of Service and Privacy Policy.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">8. Changes</h2>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
