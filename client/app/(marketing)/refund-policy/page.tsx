import { SUPPORT_EMAIL } from "@/lib/constants"

export default function RefundPolicy() {
  return (
    <main className="container mx-auto px-4 py-20 max-w-3xl">
      <h1 className="text-4xl font-black tracking-tight mb-8">Refund Policy</h1>
      
      <div className="prose prose-invert space-y-6 text-muted-foreground">
        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">1. Refund Eligibility</h2>
          <p>
            We offer a <strong>7-day money-back guarantee</strong> for your initial purchase. If you are not satisfied with the service for any reason, you may request a full refund within 7 days of your first subscription payment.
          </p>
          <p className="mt-4">
            Please note that as we incur immediate costs for AI processing (OpenAI tokens) and data retrieval, we reserve the right to decline refund requests if a significant number of leads have already been processed or exported during the 7-day window.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">2. How to Request</h2>
          <p>
            To request a refund, please contact us at <strong>{SUPPORT_EMAIL}</strong>. Please include your account email and a brief reason for the request.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-foreground mb-3">3. Cancellations</h2>
          <p>
            You can cancel your subscription at any time directly from your dashboard. Your access will remain active until the end of your current billing period.
          </p>
        </section>

        <section className="pt-8 border-t border-border/40 text-xs">
          <p>Our order process is conducted by our online reseller & Merchant of Record, Paddle.com, who also handles all customer service inquiries and returns.</p>
          <p className="mt-2">Last updated: April 26, 2026</p>
        </section>
      </div>
    </main>
  )
}
