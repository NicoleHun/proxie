"use client"

import Image from "next/image"
import { Linkedin, Mail, Copy, Check } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { PERSONAL_INFO } from "@/lib/constants"

export function HeroSection() {
  const [showEmailPopup, setShowEmailPopup] = useState(false)
  const [copied, setCopied] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(PERSONAL_INFO.email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowEmailPopup(false)
      }
    }

    if (showEmailPopup) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmailPopup])
  return (
    <section className="flex flex-col items-center gap-10 px-6 py-16 md:flex-row md:items-start md:gap-16">
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        <div className="relative h-96 w-80 overflow-hidden rounded-[50%] border-4 border-primary/20 shadow-lg md:h-[30rem] md:w-96">
          <Image
            src="/images/profile.jpg"
            alt="Nicole's profile photo"
            fill
            sizes="(max-width: 768px) 320px, 384px"
            className="object-cover"
            priority
          />
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-4 text-center md:text-left">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-foreground md:text-4xl text-balance">
          {`Hi, I'm ${PERSONAL_INFO.name}!`}
        </h1>

        <p className="text-lg leading-relaxed text-muted-foreground text-pretty">
          {PERSONAL_INFO.bio.intro}
        </p>

        <p className="text-base leading-relaxed text-muted-foreground text-pretty">
          {PERSONAL_INFO.bio.closing}
        </p>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 md:justify-start">
          <a
            href={PERSONAL_INFO.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            aria-label="LinkedIn profile"
          >
            <Linkedin className="h-4 w-4" />
            <span>LinkedIn</span>
          </a>
          <div ref={popupRef} className="relative">
            <button
              onClick={() => setShowEmailPopup(!showEmailPopup)}
              className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
              aria-label="Show email"
            >
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </button>

            {/* Email Popup */}
            {showEmailPopup && (
              <div className="absolute left-0 top-12 z-10 flex items-center gap-2 rounded-lg border border-border bg-card p-3 shadow-lg">
                <span className="text-sm text-foreground">
                  {PERSONAL_INFO.email}
                </span>
                <button
                  onClick={handleCopyEmail}
                  className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-secondary"
                  aria-label="Copy email"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
