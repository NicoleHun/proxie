"use client"

import { useState, useEffect } from "react"

const NAV_LINKS: [string, string][] = [
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["writing", "Writing"],
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const scrollY = window.scrollY
      const vh = window.innerHeight
      const scrollHeight = document.documentElement.scrollHeight

      setScrolled(scrollY > 20)

      // Near bottom of page → activate writing (only if page is tall enough)
      if (scrollHeight > vh && scrollY + vh >= scrollHeight - 60) {
        setActive("writing")
        return
      }

      // Find the last section whose top has scrolled above 60% of the viewport
      let newActive: string | null = null
      for (const [id] of NAV_LINKS) {
        const el = document.getElementById(id)
        if (!el) continue
        const top = el.getBoundingClientRect().top
        if (top < vh * 0.6 && top < vh) {
          newActive = id
        }
      }
      setActive(newActive)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <header
      className="fixed top-0 left-0 right-0 z-40 transition-all duration-300"
      style={{
        background: "rgba(250,250,248,0.92)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderBottom: scrolled ? "1px solid #e8e6e0" : "1px solid transparent",
      }}
    >
      <nav
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "52px",
        }}
      >
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          style={{
            background: "none",
            border: "none",
            fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
            fontSize: "16px",
            color: "#111",
            cursor: "pointer",
            padding: 0,
          }}
        >
          Nicole Huang
        </button>

        <div style={{ display: "flex", gap: "28px", alignItems: "center" }}>
          {NAV_LINKS.map(([id, label]) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              style={{
                background: active === id ? "#111" : "none",
                border: "none",
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: active === id ? "#fafaf8" : "#aaa",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                padding: active === id ? "4px 10px" : "4px 10px",
                borderRadius: "999px",
                transition: "background 0.2s ease, color 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (active !== id) {
                  ;(e.currentTarget as HTMLElement).style.color = "#111"
                }
              }}
              onMouseLeave={(e) => {
                if (active !== id) {
                  ;(e.currentTarget as HTMLElement).style.color = "#aaa"
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>
    </header>
  )
}
