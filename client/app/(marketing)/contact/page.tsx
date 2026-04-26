import { Navbar } from "@/components/landing/navbar"
import { Footer } from "@/components/landing/footer"
import { Mail, MessageCircle, Twitter, Github } from "lucide-react"
import { SUPPORT_EMAIL } from "@/lib/constants"

export default function Contact() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-24 max-w-4xl text-center">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter mb-4">Get in touch.</h1>
        <p className="text-base sm:text-lg text-muted-foreground mb-16 max-w-2xl mx-auto">
          Need help? Have a feature request? Or just want to talk about lead generation? We're here.
        </p>

        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="p-8 rounded-md bg-muted/30 border border-border/40 hover:border-primary/40 transition-colors group">
            <Mail className="w-10 h-10 text-primary mb-6" />
            <h2 className="text-2xl font-bold mb-2">Email Support</h2>
            <p className="text-muted-foreground mb-6">Best for account issues and technical support. We aim to reply within 24 hours.</p>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary font-bold hover:underline">
              {SUPPORT_EMAIL} →
            </a>
          </div>

          <div className="p-8 rounded-2xl bg-muted/30 border border-border/40 hover:border-primary/40 transition-colors group">
            <Twitter className="w-10 h-10 text-sky-400 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Social / DM</h2>
            <p className="text-muted-foreground mb-6">Best for quick questions and updates. Follow us for the latest on AI lead gen.</p>
            <a href="https://twitter.com/knivik_io" target="_blank" className="text-sky-400 font-bold hover:underline">
              @knivik_io →
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
