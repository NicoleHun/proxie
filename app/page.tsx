import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { Chatbot } from "@/components/chatbot"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-4xl">
        <HeroSection />
        <div className="mx-6 border-t border-border" />
        <Chatbot />
      </main>
    </div>
  )
}
