"use client"

import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { Chatbot } from "@/components/chatbot"
import { ContactFooter } from "@/components/contact-footer"
import { EditProvider } from "@/components/edit-context"

export default function Home() {
  return (
    <EditProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="mx-auto max-w-4xl">
          <HeroSection />
          <div className="mx-6 border-t border-border" />
          <Chatbot />
          <div className="mx-6 border-t border-border" />
        </main>
        <ContactFooter />
      </div>
    </EditProvider>
  )
}
