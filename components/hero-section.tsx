"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { PERSONAL_INFO } from "@/lib/constants"

export function HeroSection() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <section
      style={{
        maxWidth: "660px",
        margin: "0 auto",
        padding: "120px 24px 96px",
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          gap: "40px",
          alignItems: "flex-start",
        }}
      >
        {/* Profile photo */}
        <div style={{ flexShrink: 0 }}>
          <div
            style={{
              position: "relative",
              width: "194px",
              height: "232px",
              borderRadius: "50%",
              overflow: "hidden",
              border: "2px solid #e8e6e0",
            }}
          >
            <Image
              src="/images/profile-illustration.png"
              alt="Nicole's profile illustration"
              fill
              sizes="194px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Text */}
        <div style={{ flex: 1, paddingTop: "4px" }}>
          <p
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "10px",
              color: "#aaa",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: "16px",
            }}
          >
            Program, Product &amp; Builder · AI / Autonomous Systems
          </p>

          <h1
            style={{
              fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
              fontSize: "clamp(32px, 5vw, 44px)",
              fontWeight: "400",
              color: "#111",
              lineHeight: "1.15",
              letterSpacing: "-0.02em",
              marginBottom: "16px",
            }}
          >
            {`Hi, I'm ${PERSONAL_INFO.name}.`}
          </h1>

          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "15px",
              lineHeight: "1.8",
              color: "#888",
              fontWeight: "300",
              marginBottom: "28px",
            }}
          >
            9 years of managing complex systems and building random AI things on weekends.
          </p>

          <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => scrollTo("projects")}
              style={{
                background: "#111",
                color: "#fafaf8",
                border: "none",
                padding: "10px 22px",
                borderRadius: "8px",
                fontSize: "13px",
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              See my work →
            </button>
            <a
              href={`mailto:${PERSONAL_INFO.email}`}
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                textDecoration: "none",
              }}
            >
              Get in touch ↗
            </a>
            <a
              href={PERSONAL_INFO.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: "#aaa",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
                textDecoration: "none",
              }}
            >
              LinkedIn ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
