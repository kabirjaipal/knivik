import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Problem } from "@/components/landing/problem"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-primary/3 blur-[100px]" />
      </div>

      <Navbar />
      <main className="flex-1">
        <Hero />
        <Problem />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
