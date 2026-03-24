"use client"

import Image from "next/image"
import { useState, useEffect } from "react"
import { Github, Mail, Linkedin } from "lucide-react"
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
        maxWidth: "860px",
        margin: "0 auto",
        padding: "120px 24px 40px",
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
              width: "280px",
              height: "280px",
              borderRadius: "50%",
              overflow: "hidden",
            }}
          >
            <Image
              src="/images/profile-illustration.png"
              alt="Nicole's profile illustration"
              fill
              sizes="280px"
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
              fontSize: "12px",
              color: "#555",
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
              color: "#555",
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
            <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
              <a
                href={`mailto:${PERSONAL_INFO.email}`}
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Mail size={12} />
                Get in touch ↗
              </a>
              <a
                href={PERSONAL_INFO.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
              >
                <Linkedin size={12} />
                LinkedIn ↗
              </a>
              <a
                href={PERSONAL_INFO.github}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "12px",
                  color: "#555",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  transition: "color 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = "#111"
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.color = "#555"
                }}
              >
                <Github size={12} />
                GitHub ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
