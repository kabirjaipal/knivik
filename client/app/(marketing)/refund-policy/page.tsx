import { SUPPORT_EMAIL, PROJECT_NAME } from "@/lib/constants"
import { Metadata } from "next";
import { MetadataService } from "@/lib/seo/application/metadata.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Refund Policy",
  description: `Understand the refund policy for ${PROJECT_NAME}. We strive for customer satisfaction and transparency in our billing.`,
  path: "/refund-policy",
});

export default function RefundPolicy() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Refund Policy</h1>
          <p className="text-muted-foreground text-lg">Last Updated: May 21, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 leading-relaxed text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">1. 7-Day Free Trial (Monthly Plan)</h2>
            <p>
              We want you to experience {PROJECT_NAME} completely risk-free. That's why we offer a 7-day free trial on our Monthly subscription. You can cancel at any time during the first <strong>7 days</strong> and you won't be charged a single cent. Once the trial converts and your first monthly payment is processed, subsequent charges are non-refundable, but you can cancel at any time to prevent future billing.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">2. 14-Day Money-Back Guarantee (Yearly Plan)</h2>
            <p>
              For our Yearly subscription, we offer a <strong>14-day money-back guarantee</strong>. If {PROJECT_NAME} doesn't meet your expectations or help you discover valuable leads, simply reach out to us within the first 14 days of your purchase, and we will issue a full refund—no questions asked.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">3. Cancellations & Billing Cycles</h2>
            <p>
              You can cancel your subscription at any time by clicking the <strong>"Manage Billing"</strong> button directly in the billing section of your dashboard. This securely opens the Dodo Payments customer billing hub, where you can self-manage your subscription and cancel with a single click. Upon cancellation, your access to {PROJECT_NAME} Pro features will remain active until the end of your current billing period, after which your account will automatically downgrade to the Free tier and you will not be charged again.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">4. Payment Reseller & Merchant of Record</h2>
            <p>
              We partner with <strong>Dodo Payments</strong> (DodoPayments.com) as our online reseller and Merchant of Record. They process checkout details, handle payment security, manage recurring subscription billing, and process transactional payouts.
            </p>
            <p>
              As a Merchant of Record, Dodo Payments is the data controller of your checkout information. You can read how they handle your billing details in the <a href="https://dodopayments.com/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-bold">Dodo Payments Privacy Policy</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">5. Requesting a Refund</h2>
            <p>
              To request a refund for a Yearly plan (within the 14-day window), please send an email to <strong>{SUPPORT_EMAIL}</strong> using the email address associated with your workspace. Our support team will coordinate with Dodo Payments to process your refund within 3 to 5 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
