"use client"

import { useState, useRef, useEffect } from "react"

// ─── Data ────────────────────────────────────────────────────────────────────

const projects = [
  {
    id: 3,
    title: "Proxie",
    tag: "Career chatbot",
    status: "Live" as const,
    voice: "My resume can't answer follow-up questions. This one can.",
    description:
      "An AI chatbot trained on my career history. Answers recruiter and peer questions about my background, decisions, and experience — deployed on this site.",
    stack: ["Next.js", "Claude API", "Vercel"],
    link: undefined as string | undefined,
    hasDemo: false,
  },
  {
    id: 4,
    title: "Luromo",
    tag: "Reading assistant",
    status: "Live" as const,
    voice: "Reading literature in a second language shouldn't mean stopping every other sentence to look things up.",
    description:
      "LLM-powered reading assistant for non-native English speakers. Swaps advanced vocabulary with simpler alternatives inline — minimal disruption to reading flow.",
    stack: ["LLM API", "Next.js"],
    link: "https://lurumo.com",
    hasDemo: false,
  },
  {
    id: 1,
    title: "Bloom Unit",
    tag: "Multi-agent system",
    status: "In progress" as const,
    voice: "I kept losing ideas in voice memos at 2am. So I built a pipeline to make them actionable.",
    description:
      "Captures startup ideas via Telegram voice note and routes them through specialized agents — transcription, clarification, market research, feasibility — ending in a structured MVP spec stored in a vector database.",
    stack: ["LangGraph", "Python", "Claude Sonnet", "Groq/Whisper", "Supabase pgvector", "Railway"],
    link: undefined,
    hasDemo: true,
  },
  {
    id: 2,
    title: "PM Thinking Agent",
    tag: "Fine-tuned LLM",
    status: "In progress" as const,
    voice: "I wanted a sparring partner that would actually push back on my product thinking.",
    description:
      "Fine-tuned a small LLM for PM reasoning, with a structured eval system scoring tone, framework use, and generalization. LLM-as-judge with prompt caching for fast, cost-efficient iteration.",
    stack: ["Claude API", "Batch API", "Prompt Caching", "Python"],
    link: undefined,
    hasDemo: false,
  },
]

// ─── Bloom Unit demo steps ────────────────────────────────────────────────────

type DemoStep = {
  id: string
  label: string
  icon: string
  type: "input" | "processing" | "done"
  content?: string
  output?: Record<string, string | string[]>
}

const demoSteps: DemoStep[] = [
  {
    id: "voice",
    label: "Voice note received",
    icon: "🎙️",
    type: "input",
    content:
      '"okay so i was thinking — what if there was an app that let baristas log customer preferences over time, like a CRM but for coffee shops, so regulars always get their order remembered even at new locations..."',
  },
  {
    id: "transcribe",
    label: "Agent 1 · Idea Capture",
    icon: "⟳",
    type: "processing",
    output: {
      title: "Coffee Shop Customer CRM",
      problem: "Baristas can't remember returning customers' preferences across visits or locations.",
      solution: "A lightweight CRM for coffee shops that logs customer orders and surfaces them at point-of-sale.",
      target: "Independent coffee shop owners and multi-location chains",
    },
  },
  {
    id: "prd",
    label: "Agent 2 · PRD Clarifier",
    icon: "⟳",
    type: "processing",
    output: {
      coreFeature: "Customer preference profiles linked to phone number or loyalty ID",
      mvpScope: "POS integration, barista-facing order history, basic preference tagging",
      openQuestions: [
        "How does data sync across locations?",
        "Privacy / data retention policy?",
        "B2B or direct-to-consumer pricing?",
      ] as unknown as string,
    },
  },
  {
    id: "notion",
    label: "Saved to Notion",
    icon: "✓",
    type: "done",
    content: "Idea structured and stored. Ready for market research pass.",
  },
]

// ─── BloomDemo ────────────────────────────────────────────────────────────────

function BloomDemo() {
  const [step, setStep] = useState(0)
  const [animating, setAnimating] = useState(false)

  const advance = () => {
    if (step >= demoSteps.length - 1 || animating) return
    setAnimating(true)
    setTimeout(() => {
      setStep((s) => s + 1)
      setAnimating(false)
    }, 600)
  }

  const reset = () => {
    setStep(0)
    setAnimating(false)
  }

  const current = demoSteps[step]

  return (
    <div
      style={{
        background: "#f7f6f3",
        border: "1px solid #e4e2dc",
        borderRadius: "14px",
        overflow: "hidden",
        marginTop: "20px",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e4e2dc",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", gap: "6px" }}>
          {(["#f87171", "#fbbf24", "#4ade80"] as const).map((c, i) => (
            <div
              key={i}
              style={{ width: "8px", height: "8px", borderRadius: "50%", background: c }}
            />
          ))}
        </div>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#aaa",
            letterSpacing: "0.05em",
          }}
        >
          bloom-unit · live demo
        </span>
        <button
          onClick={reset}
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#bbb",
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          reset
        </button>
      </div>

      {/* Progress dots */}
      <div style={{ padding: "16px 18px 8px", display: "flex", gap: "6px", alignItems: "center" }}>
        {demoSteps.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: i < step ? "#4ade80" : i === step ? "#111" : "#e4e2dc",
                transition: "background 0.3s ease",
                flexShrink: 0,
              }}
            />
            {i < demoSteps.length - 1 && (
              <div
                style={{
                  width: "24px",
                  height: "1px",
                  background: i < step ? "#4ade80" : "#e4e2dc",
                  transition: "background 0.3s ease",
                }}
              />
            )}
          </div>
        ))}
        <span
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#aaa",
            marginLeft: "8px",
          }}
        >
          {step + 1}/{demoSteps.length}
        </span>
      </div>

      {/* Step content */}
      <div style={{ padding: "16px 18px 20px", minHeight: "180px" }}>
        <div
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? "translateY(6px)" : "none",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
            <span style={{ fontSize: "14px" }}>{current.icon}</span>
            <span
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "10px",
                color: "#888",
                textTransform: "uppercase",
                letterSpacing: "0.07em",
              }}
            >
              {current.label}
            </span>
          </div>

          {current.type === "input" && (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e4e2dc",
                borderRadius: "10px",
                padding: "14px 16px",
                fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "15px",
                color: "#555",
                lineHeight: "1.65",
              }}
            >
              {current.content}
            </div>
          )}

          {current.type === "processing" && current.id === "transcribe" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {Object.entries(current.output ?? {}).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    background: "#fff",
                    border: "1px solid #e4e2dc",
                    borderRadius: "8px",
                    padding: "10px 14px",
                    display: "flex",
                    gap: "12px",
                    alignItems: "baseline",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      fontSize: "9px",
                      color: "#aaa",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      minWidth: "60px",
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "13px",
                      color: "#333",
                      lineHeight: "1.5",
                    }}
                  >
                    {v as string}
                  </span>
                </div>
              ))}
            </div>
          )}

          {current.type === "processing" && current.id === "prd" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {(["coreFeature", "mvpScope"] as const).map((field) => (
                <div
                  key={field}
                  style={{ background: "#fff", border: "1px solid #e4e2dc", borderRadius: "8px", padding: "10px 14px" }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                      fontSize: "9px",
                      color: "#aaa",
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      marginBottom: "4px",
                    }}
                  >
                    {field === "coreFeature" ? "Core feature" : "MVP scope"}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#333" }}>
                    {current.output?.[field] as string}
                  </div>
                </div>
              ))}
              <div
                style={{ background: "#fff", border: "1px solid #e4e2dc", borderRadius: "8px", padding: "10px 14px" }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "9px",
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: "6px",
                  }}
                >
                  Open questions
                </div>
                {(current.output?.openQuestions as unknown as string[]).map((q, i) => (
                  <div
                    key={i}
                    style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "13px", color: "#666", lineHeight: "1.6" }}
                  >
                    · {q}
                  </div>
                ))}
              </div>
            </div>
          )}

          {current.type === "done" && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ fontSize: "18px" }}>✓</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "14px", color: "#166534" }}>
                {current.content}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div style={{ padding: "0 18px 18px", display: "flex", justifyContent: "flex-end" }}>
        {step < demoSteps.length - 1 ? (
          <button
            onClick={advance}
            style={{
              background: "#111",
              color: "#fff",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "11px",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            next step →
          </button>
        ) : (
          <button
            onClick={reset}
            style={{
              background: "transparent",
              color: "#888",
              border: "1px solid #e4e2dc",
              padding: "8px 18px",
              borderRadius: "8px",
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "11px",
              cursor: "pointer",
              letterSpacing: "0.04em",
            }}
          >
            run again ↺
          </button>
        )}
      </div>
    </div>
  )
}

// ─── ProjectCard ──────────────────────────────────────────────────────────────

function ProjectCard({ project, index }: { project: (typeof projects)[0]; index: number }) {
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
        transform: visible ? "none" : "translateY(16px)",
        transition: `opacity 0.5s ease ${index * 0.08}s, transform 0.5s ease ${index * 0.08}s`,
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: open ? "#fff" : "#fafaf8",
          border: `1px solid ${open ? "#d4d1ca" : "#e8e6e0"}`,
          borderRadius: "12px",
          padding: "22px 24px",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: open ? "0 4px 20px rgba(0,0,0,0.06)" : "none",
        }}
        onMouseEnter={(e) => {
          if (!open) {
            const el = e.currentTarget as HTMLElement
            el.style.background = "#fff"
            el.style.borderColor = "#d4d1ca"
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            const el = e.currentTarget as HTMLElement
            el.style.background = "#fafaf8"
            el.style.borderColor = "#e8e6e0"
          }
        }}
      >
        {/* Card header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <span
                style={{
                  fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
                  fontSize: "19px",
                  fontWeight: "500",
                  color: "#111",
                  letterSpacing: "-0.01em",
                }}
              >
                {project.title}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "9px",
                  color: "#bbb",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                }}
              >
                {project.tag}
              </span>
            </div>
            <p
              style={{
                fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "15px",
                color: "#888",
                lineHeight: "1.5",
                margin: 0,
              }}
            >
              &ldquo;{project.voice}&rdquo;
            </p>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              gap: "8px",
              marginLeft: "16px",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "9px",
                color: project.status === "Live" ? "#2d9c5e" : "#b07d2e",
                letterSpacing: "0.05em",
              }}
            >
              {project.status === "Live" ? "● " : "○ "}
              {project.status}
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

        {/* Expanded content */}
        {open && (
          <div style={{ marginTop: "18px", animation: "expandIn 0.2s ease" }}>
            <p
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
                lineHeight: "1.75",
                color: "#333",
                marginBottom: "16px",
                marginTop: 0,
              }}
            >
              {project.description}
            </p>

            <div
              style={{
                display: "flex",
                gap: "5px",
                flexWrap: "wrap",
                marginBottom: project.hasDemo || project.link ? "16px" : 0,
              }}
            >
              {project.stack.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "10px",
                    color: "#999",
                    background: "#f0ede8",
                    padding: "3px 8px",
                    borderRadius: "4px",
                    letterSpacing: "0.02em",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>

            {project.link && (
              <a
                href={project.link}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                style={{
                  fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                  fontSize: "10px",
                  color: "#111",
                  textDecoration: "underline",
                  textUnderlineOffset: "3px",
                  letterSpacing: "0.04em",
                  display: "inline-block",
                }}
              >
                Visit site ↗
              </a>
            )}

            {project.hasDemo && (
              <div onClick={(e) => e.stopPropagation()}>
                {/* Screenshots */}
                <div
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "10px",
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: "8px",
                  }}
                >
                  Screenshots
                </div>
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                  {/* Dashboard screenshot */}
                  <div style={{ flex: "3", minWidth: 0 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        borderRadius: "8px",
                        border: "1px solid #e4e2dc",
                        height: "160px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/bloom-unit-demo.png"
                        alt="Bloom Unit dashboard"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                      />
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        fontSize: "9px",
                        color: "#bbb",
                        marginTop: "5px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      Web dashboard
                    </p>
                  </div>
                  {/* Telegram screenshot */}
                  <div style={{ flex: "2", minWidth: 0 }}>
                    <div
                      style={{
                        overflow: "hidden",
                        borderRadius: "8px",
                        border: "1px solid #e4e2dc",
                        height: "160px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/images/bloom-unit-telegram.png"
                        alt="IdeaSprout Telegram bot"
                        style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
                      />
                    </div>
                    <p
                      style={{
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        fontSize: "9px",
                        color: "#bbb",
                        marginTop: "5px",
                        letterSpacing: "0.04em",
                      }}
                    >
                      IdeaSprout · Telegram bot
                    </p>
                  </div>
                </div>

                {/* Interactive demo */}
                <div
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "10px",
                    color: "#aaa",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: "4px",
                  }}
                >
                  Interactive demo
                </div>
                <BloomDemo />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── ProjectsSection ──────────────────────────────────────────────────────────

export function ProjectsSection() {
  return (
    <section
      id="projects"
      style={{
        maxWidth: "660px",
        margin: "0 auto",
        padding: "0 24px 96px",
      }}
    >
      <p
        style={{
          fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
          fontSize: "10px",
          color: "#aaa",
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          marginBottom: "24px",
        }}
      >
        Projects — things I built to scratch my own itch
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {projects.map((p, i) => (
          <ProjectCard key={p.id} project={p} index={i} />
        ))}
      </div>
    </section>
  )
}
