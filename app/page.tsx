import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { ProjectsSection } from "@/components/projects-section"
import { WorkSection } from "@/components/work-section"
import { ProxieFAB } from "@/components/proxie-fab"

export default function Home() {
  return (
    <div style={{ background: "#fafaf8", minHeight: "100vh", color: "#111" }}>
      <Navbar />

      <main>
        <HeroSection />
        <ProjectsSection />
        <WorkSection />

        {/* Writing — placeholder */}
        <section
          id="writing"
          style={{
            maxWidth: "660px",
            margin: "0 auto",
            padding: "0 24px 120px",
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
            Writing
          </p>
          <div
            style={{
              borderTop: "1px solid #e8e6e0",
              padding: "22px 0",
              borderBottom: "1px solid #e8e6e0",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
                fontStyle: "italic",
                fontSize: "16px",
                color: "#bbb",
                margin: 0,
              }}
            >
              Product teardowns and AI tool deep dives — coming soon.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer
        style={{
          maxWidth: "660px",
          margin: "0 auto",
          padding: "24px 24px 48px",
          display: "flex",
          justifyContent: "space-between",
          borderTop: "1px solid #e8e6e0",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#ccc",
          }}
        >
          © 2025 Nicole Huang
        </span>
        <span
          style={{
            fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
            fontSize: "10px",
            color: "#ccc",
          }}
        >
          built in public
        </span>
      </footer>

      <ProxieFAB />
    </div>
  )
}
