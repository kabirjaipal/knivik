import { PROJECT_NAME } from "@/lib/constants"
import { Metadata } from "next";
import { MetadataService } from "@/lib/seo/application/metadata.service";

export const metadata: Metadata = MetadataService.constructPageMetadata({
  title: "Privacy Policy",
  description: `Learn how ${PROJECT_NAME} collects, uses, and protects your data. We are committed to maintaining your privacy and transparency in our AI operations.`,
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-24 max-w-4xl">
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Privacy Policy</h1>
          <p className="text-muted-foreground text-lg">Last Updated: April 26, 2026</p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-10 leading-relaxed text-muted-foreground">
          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">1. Information We Collect</h2>
            <p>
              We collect information that you provide to us directly, such as when you create or modify your account, request customer support, or otherwise communicate with us. This information may include your name, email address, password, and product details.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">2. How We Use Your Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, including to identify and score leads for you. We also use it to communicate with you about your account and the services we provide.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">3. Sharing of Information</h2>
            <p>
              We do not share your private information with third parties except as described in this policy, such as when required by law or to protect our rights.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">4. Data Security</h2>
            <p>
              We take reasonable measures to protect your personal information from loss, theft, misuse, and unauthorized access. However, no internet transmission is ever completely secure.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">5. Data Retention</h2>
            <p>
              We store the information we collect for as long as it is necessary for the purposes for which we originally collected it.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">6. Your Choice</h2>
            <p>
              You can access and update your account information at any time through your dashboard. You may also request that we delete your account and personal information.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">7. Payment Processors</h2>
            <p>
              We use Dodo Payments for payments, and as a Merchant of Record, they are the data controller of your checkout information. You can read how they handle your data in the <a href="https://dodopayments.com/privacy-policy" target="_blank" className="text-primary hover:underline">Dodo Payments Privacy Policy</a>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground border-b border-border pb-2 inline-block">8. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please reach out to us via direct message on our official Twitter / X (<strong>@knivikai</strong>) or Instagram (<strong>@knivikai</strong>).
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
