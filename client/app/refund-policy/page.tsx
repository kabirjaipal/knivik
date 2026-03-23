import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"

export default function RefundPolicy() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-20 max-w-3xl">
        <h1 className="text-4xl font-black tracking-tight mb-8">Refund Policy</h1>
        
        <div className="prose prose-invert space-y-6 text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">1. Monthly Subscriptions</h2>
            <p>
              We want you to be 100% satisfied with Knivik. If you are not satisfied with your monthly subscription, you may request a full refund within **7 days** of your initial purchase. After 7 days, your subscription is non-refundable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">2. Yearly Subscriptions</h2>
            <p>
              Yearly subscriptions are eligible for a full refund within **14 days** of purchase. Because of the significant discount offered on yearly plans, we cannot offer partial refunds for the remaining months if you decide to cancel later in the year.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">3. Lead Quality Disclaimer</h2>
            <p>
              Knivik uses advanced AI to detect leads. While we strive for 100% accuracy, lead quality is subjective and dependent on platform activity. Refunds will not be issued based on the "volume" of leads found, as this depends on the keywords and markets you choose to track.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-3">4. How to Request</h2>
            <p>
              To request a refund, please email us at **support@knivik.io** with your account email and reason for the request. We typically process refunds within 3-5 business days.
            </p>
          </section>

          <section className="pt-8 border-t border-border/40 text-sm">
            <p>Last updated: March 24, 2026</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  )
}
