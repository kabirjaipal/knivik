import { Navbar } from "@/components/landing/navbar"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Problem } from "@/components/landing/problem"
import { Footer } from "@/components/landing/footer"

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Features />
    </>
  )
}
