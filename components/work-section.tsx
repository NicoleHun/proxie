"use client"

import { useState, useRef, useEffect } from "react"

const workHistory = [
  {
    company: "Nuro.ai",
    role: "AI Platform TPM",
    period: "2022 — Present",
    location: "Mountain View, CA",
    bullets: [
      "Launched autonomous vehicles on public road, drove sensor data collection quality improvement, compute resources and inference latency optimization, toolings, routing, and API integration.",
    ],
  },
  {
    company: "Apple",
    role: "Engineering Program Manager",
    period: "2021 — 2022",
    location: "Cupertino, CA",
    bullets: [
      "Led display module development for Apple Watch Ultra across the full NPI lifecycle — Proto, EVT, DVT — with overseas vendors. Ran silicon-level and PCBA-level bring-up.",
    ],
  },
  {
    company: "Applied Materials",
    role: "Systems Engineer",
    period: "2017 — 2021",
    location: "Sunnyvale, CA",
    bullets: [
      "Built automatic micro-zone diagnostic tools for electrostatic chuck dead-spot identification. Used mathematical modeling to predict design outcomes and increase yield.",
    ],
  },
]

function WorkCard({ job, index }: { job: (typeof workHistory)[0]; index: number }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true)
      },
      { threshold: 0.1 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(12px)",
        transition: `opacity 0.4s ease ${index * 0.08}s, transform 0.4s ease ${index * 0.08}s`,
        borderTop: "1px solid #e8e6e0",
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "20px 0",
          cursor: "pointer",
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "12px",
          alignItems: "start",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: "10px",
              marginBottom: "4px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
                fontSize: "18px",
                fontWeight: "500",
                color: "#111",
              }}
            >
              {job.company}
            </span>
            <span
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "11px",
                color: "#555",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {job.location}
            </span>
          </div>
          <div
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "14px",
              color: "#555",
              fontWeight: "300",
            }}
          >
            {job.role}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "3px" }}>
          <span
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "12px",
              color: "#555",
              letterSpacing: "0.03em",
            }}
          >
            {job.period}
          </span>
          <span
            style={{
              fontSize: "13px",
              color: "#ccc",
              transform: open ? "rotate(45deg)" : "none",
              transition: "transform 0.2s ease",
              display: "inline-block",
              lineHeight: 1,
            }}
          >
            +
          </span>
        </div>
      </div>

      {open && (
        <div style={{ paddingBottom: "20px", animation: "expandIn 0.2s ease" }}>
          {job.bullets.map((b, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: "12px",
                marginBottom: "10px",
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  color: "#ccc",
                  fontSize: "12px",
                  marginTop: "3px",
                  flexShrink: 0,
                }}
              >
                —
              </span>
              <p
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "13px",
                  lineHeight: "1.75",
                  color: "#666",
                  margin: 0,
                }}
              >
                {b}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function WorkSection() {
  return (
    <section
      id="experience"
      style={{
        maxWidth: "860px",
        margin: "0 auto",
        padding: "0 24px 96px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          fontSize: "11px",
          color: "#111",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          marginBottom: "32px",
          borderLeft: "3px solid #111",
          paddingLeft: "12px",
        }}
      >
        Experience
      </p>

      <div>
        {workHistory.map((job, i) => (
          <WorkCard key={job.company} job={job} index={i} />
        ))}
        <div style={{ borderTop: "1px solid #e8e6e0" }} />
      </div>

      <div style={{ marginTop: "20px" }}>
        <a
          href="https://www.linkedin.com/in/zheng-nicole-huang"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#111",
            textTransform: "uppercase",
            letterSpacing: "0.07em",
            textDecoration: "underline",
            textUnderlineOffset: "3px",
          }}
        >
          Full profile on LinkedIn ↗
        </a>
      </div>
    </section>
  )
}
