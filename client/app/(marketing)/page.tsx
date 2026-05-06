import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Problem } from "@/components/landing/problem"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How does Knivik find leads on Reddit and Twitter?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Knivik automatically scans public platforms like Reddit, Twitter, and HackerNews using AI to detect high-intent buying signals, allowing you to engage with warm leads instantly."
                }
              },
              {
                "@type": "Question",
                "name": "What is AI social intelligence?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "AI social intelligence uses natural language processing to monitor social media and forums, identifying users who are actively asking for product recommendations or expressing pain points."
                }
              }
            ]
          }),
        }}
      />
      <Hero />
      <Problem />
      <Features />
    </>
  )
}
