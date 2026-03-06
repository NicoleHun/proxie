# Proxie

My personal website — built to show what I do by actually doing it.

The site is a minimal portfolio, but the real feature is **Proxie**: an AI chatbot that acts as my digital twin. Instead of a static resume, visitors can have a real conversation about my career — and Proxie answers from a live knowledge base, not from guesswork.

## Why it's different

Most portfolio sites are read-only. This one talks back.

Proxie fetches before it speaks. Every response is grounded in real career documents — work history, projects, skills, writing — served through a Google Drive MCP server. If the knowledge base is down, Proxie says so and points to my email. No hallucination, no smooth dodges.

The chatbot also knows when to stop selling and when to ask for the meeting. CTA timing is handled by the backend so Proxie never interrupts a good answer to push a Calendly link.

## Key features

- **Proxie** — floating chat interface, Claude-powered, RAG over a structured knowledge base
- **Ratings & telemetry** — thumbs up/down with constrained reason labels; latency and token usage tracked per session
- **Portfolio sections** — Projects, Experience, Writing with expandable cards and live demos
- **Built in public** — the site itself is one of the projects

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| AI | Claude API (Anthropic SDK) |
| Knowledge base | Google Drive via MCP server |
| Database | Neon (serverless Postgres) |
| UI | Radix UI + Tailwind CSS v4 |
| Hosting | Vercel |

## Running locally

```bash
npm install
npm run dev
```

Requires env vars for Anthropic API key, Neon DB connection string, and Google Drive MCP credentials.
