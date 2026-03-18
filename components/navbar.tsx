"use client"

import { useState, useEffect } from "react"

const NAV_LINKS: [string, string][] = [
  ["projects", "Projects"],
  ["experience", "Experience"],
  ["writing", "Writing"],
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll)
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
          maxWidth: "660px",
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
                background: "none",
                border: "none",
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: "#aaa",
                cursor: "pointer",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                padding: 0,
                transition: "color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = "#111"
              }}
              onMouseLeave={(e) => {
                ;(e.currentTarget as HTMLElement).style.color = "#aaa"
              }}
            >
              {label}
            </button>
          ))}
          <a
            href="https://www.linkedin.com/in/zheng-nicole-huang"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "10px",
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.color = "#111"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.color = "#aaa"
            }}
          >
            LinkedIn ↗
          </a>
          <a
            href="https://github.com/NicoleHun"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "10px",
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              textDecoration: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.color = "#111"
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.color = "#aaa"
            }}
          >
            GitHub ↗
          </a>
        </div>
      </nav>
    </header>
  )
}
