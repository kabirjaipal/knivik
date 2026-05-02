import { SUPPORT_EMAIL, PROJECT_NAME } from "@/lib/constants"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: `Understand the refund policy for ${PROJECT_NAME}. We strive for customer satisfaction and transparency in our billing.`,
};

export default function RefundPolicy() {
  return (
    <main className="container mx-auto px-4 py-20 max-w-3xl">
      <h1 className="text-4xl font-black tracking-tight mb-8">Refund Policy</h1>
      
      <div className="prose prose-invert space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. All Sales are Final</h2>
          <p>
            Due to the immediate, non-recoverable costs associated with our AI processing (OpenAI tokens) and infrastructure usage for real-time social listening, <strong>we do not offer refunds</strong>. 
          </p>
          <p className="mt-4">
            Once a subscription payment is processed, the transaction is considered final. Please carefully review our features and the Free plan (if available) before committing to a paid subscription.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. Cancellations</h2>
          <p>
            You can cancel your subscription at any time directly from your dashboard. Your access will remain active until the end of your current billing period, but you will not be charged for the following billing cycle.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Exceptions</h2>
          <p>
            In the rare event of a duplicate charge or technical error originating entirely from our payment processor (Lemon Squeezy), please contact us at <strong>{SUPPORT_EMAIL}</strong> within 7 days of the charge for an adjustment.
          </p>
        </section>

        <section className="pt-8 border-t border-border/40 text-xs">
          <p>Our order process is conducted by our online reseller & Merchant of Record, LemonSqueezy.com, who also handles all customer service inquiries and returns.</p>
          <p className="mt-2">Last updated: April 26, 2026</p>
        </section>
      </div>
    </main>
  )
}
