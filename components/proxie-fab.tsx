"use client"

import { useState, useRef, useEffect } from "react"
import { ThumbsUp, ThumbsDown, User } from "lucide-react"
import { PERSONAL_INFO } from "@/lib/constants"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Image from "next/image"
import { FeedbackDialog } from "@/components/feedback-dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

type Rating = "up" | "down" | null

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

type MessageTelemetry = {
  clientLatencyMs?: number | null
  serverLatencyMs?: number | null
  outputTokenCount?: number | null
  promptVersion?: string | null
}

type FeedbackDialogState = {
  open: boolean
  messageId: string
  index: number
  messageContent: string
  telemetry?: MessageTelemetry
}

const LATENCY_MODE = "sonnet-stream"

// ─── Shared bubble styles ─────────────────────────────────────────────────────

const bubbleBase: React.CSSProperties = {
  maxWidth: "82%",
  borderRadius: "12px",
  padding: "9px 13px",
  fontSize: "13px",
  lineHeight: "1.55",
  fontFamily: "'DM Sans', sans-serif",
}

const proxieBubble: React.CSSProperties = {
  ...bubbleBase,
  background: "#f4f2ee",
  color: "#444",
  borderRadius: "12px 12px 12px 3px",
}

const userBubble: React.CSSProperties = {
  ...bubbleBase,
  background: "#111",
  color: "#fff",
  borderRadius: "12px 12px 3px 12px",
}

// ─── ProxieFAB ────────────────────────────────────────────────────────────────

export function ProxieFAB() {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState("")
  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [streamingText, setStreamingText] = useState("")
  const [streamPhase, setStreamPhase] = useState<"thinking" | "fetching" | "responding" | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [feedbackDialog, setFeedbackDialog] = useState<FeedbackDialogState | null>(null)
  const [messageTelemetry, setMessageTelemetry] = useState<Record<string, MessageTelemetry>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSessionId(crypto.randomUUID())
  }, [])

  useEffect(() => {
    if (!messagesEndRef.current) return
    if (messages.length === 0 && !streamingText) return
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  async function handleRate(
    messageId: string,
    rating: Rating,
    index?: number,
    messageContent?: string
  ) {
    if (!sessionId || index === undefined) return

    const newRating = ratings[messageId] === rating ? null : rating
    setRatings((prev) => ({ ...prev, [messageId]: newRating }))
    if (!newRating) return

    const telemetry = messageTelemetry[messageId] ?? {}

    if (newRating === "down") {
      setFeedbackDialog({
        open: true,
        messageId,
        index,
        messageContent: messageContent ?? "",
        telemetry,
      })
      return
    }

    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message_index: index,
          message_content: messageContent ?? null,
          rating: "thumbs_up",
          server_latency_ms: telemetry.serverLatencyMs ?? null,
          client_latency_ms: telemetry.clientLatencyMs ?? null,
          output_token_count: telemetry.outputTokenCount ?? null,
          prompt_version: telemetry.promptVersion ?? null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error("Rating API error:", res.status, body)
      }
    } catch (err) {
      console.error("Failed to submit rating:", err)
    }
  }

  async function handleFeedbackSubmit(reason: string | null, feedbackText: string) {
    if (!feedbackDialog || !sessionId) return
    const { messageId, index, messageContent, telemetry = {} } = feedbackDialog
    setFeedbackDialog(null)

    try {
      const res = await fetch("/api/rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message_index: index,
          message_content: messageContent || null,
          rating: "thumbs_down",
          reason,
          feedback_text: feedbackText || null,
          server_latency_ms: telemetry.serverLatencyMs ?? null,
          client_latency_ms: telemetry.clientLatencyMs ?? null,
          output_token_count: telemetry.outputTokenCount ?? null,
          prompt_version: telemetry.promptVersion ?? null,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error("Rating API error:", res.status, body)
      }
    } catch (err) {
      console.error("Failed to submit rating:", err)
    }
  }

  function handleFeedbackCancel() {
    if (!feedbackDialog) return
    setRatings((prev) => ({ ...prev, [feedbackDialog.messageId]: null }))
    setFeedbackDialog(null)
  }

  async function handleStreamingSubmit(userInput: string, sendTime: number) {
    const response = await fetch(`/api/chat?mode=${LATENCY_MODE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput, session_id: sessionId }),
    })

    if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`)

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let accumulated = ""

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split("\n")
      buffer = lines.pop() ?? ""

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const raw = line.slice(6)
          try {
            const parsed = JSON.parse(raw)
            if (parsed.phase) {
              setStreamPhase(parsed.phase)
            } else if (parsed.text !== undefined) {
              accumulated += parsed.text
              setStreamingText(accumulated)
            } else if (parsed.session_id) {
              const renderTime = Date.now()
              const msgId = (Date.now() + 1).toString()
              setMessages((prev) => [
                ...prev,
                { id: msgId, role: "assistant", content: accumulated },
              ])
              setStreamingText("")
              setStreamPhase(null)
              setMessageTelemetry((prev) => ({
                ...prev,
                [msgId]: {
                  clientLatencyMs: renderTime - sendTime,
                  serverLatencyMs: parsed.server_latency_ms ?? null,
                  outputTokenCount: parsed.output_token_count ?? null,
                  promptVersion: parsed.prompt_version ?? null,
                },
              }))
            } else if (parsed.message) {
              throw new Error(parsed.message)
            }
          } catch {
            // non-JSON line — skip
          }
        }
      }
    }

    return accumulated
  }

  async function handleJsonSubmit(userInput: string, sendTime: number) {
    const response = await fetch(`/api/chat?mode=${LATENCY_MODE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput, session_id: sessionId }),
    })
    const data = await response.json()

    if (data.reply) {
      const renderTime = Date.now()
      const msgId = (Date.now() + 1).toString()
      setMessages((prev) => [...prev, { id: msgId, role: "assistant", content: data.reply }])
      setMessageTelemetry((prev) => ({
        ...prev,
        [msgId]: {
          clientLatencyMs: renderTime - sendTime,
          serverLatencyMs: data.server_latency_ms ?? null,
          outputTokenCount: data.output_token_count ?? null,
          promptVersion: data.prompt_version ?? null,
        },
      }))
    } else {
      throw new Error(data.error || "Failed to get reply")
    }
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input }
    setMessages((prev) => [...prev, userMessage])
    const userInput = input
    setInput("")
    setIsLoading(true)
    const sendTime = Date.now()

    try {
      if (LATENCY_MODE === "stream" || LATENCY_MODE === "sonnet-stream") {
        await handleStreamingSubmit(userInput, sendTime)
      } else {
        await handleJsonSubmit(userInput, sendTime)
      }
    } catch (err) {
      console.error("Chat error:", err)
      setStreamingText("")
      setStreamPhase(null)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting right now. Please try again later.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const phaseLabel =
    streamPhase === "fetching"
      ? "Looking up Nicole's info..."
      : streamPhase === "thinking"
        ? "Thinking..."
        : null

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: "80px",
            right: "24px",
            width: "320px",
            maxHeight: "440px",
            background: "#fff",
            border: "1px solid #e8e6e0",
            borderRadius: "16px",
            boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
            display: "flex",
            flexDirection: "column",
            zIndex: 50,
            animation: "fabOpen 0.22s cubic-bezier(0.34,1.4,0.64,1)",
            overflow: "hidden",
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid #f0ede8",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  position: "relative",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: "1.5px solid #e8e6e0",
                  flexShrink: 0,
                }}
              >
                <Image src="/proxie-avatar.png" alt="Proxie" fill className="object-cover" />
              </div>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-eb-garamond), 'EB Garamond', serif",
                    fontSize: "16px",
                    color: "#111",
                    fontWeight: "500",
                  }}
                >
                  {PERSONAL_INFO.proxie.name}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                    fontSize: "9px",
                    color: "#2d9c5e",
                    letterSpacing: "0.04em",
                    marginTop: "1px",
                  }}
                >
                  ● {PERSONAL_INFO.name}&apos;s digital twin
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: "none",
                border: "none",
                color: "#ccc",
                fontSize: "20px",
                cursor: "pointer",
                lineHeight: 1,
                padding: "0 2px",
              }}
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "14px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {/* Opening message */}
            <div>
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={proxieBubble}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {PERSONAL_INFO.proxie.greeting}
                  </ReactMarkdown>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-start", marginTop: "4px", paddingLeft: "2px" }}>
                <RatingButtons
                  messageId="opening-message"
                  index={-1}
                  content={PERSONAL_INFO.proxie.greeting}
                  ratings={ratings}
                  onRate={handleRate}
                />
              </div>
            </div>

            {/* Conversation messages */}
            {messages.map((message, index) => {
              const isUser = message.role === "user"
              return (
                <div key={message.id}>
                  <div style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                    {isUser ? (
                      <div style={userBubble}>{message.content}</div>
                    ) : (
                      <div style={proxieBubble}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                  {!isUser && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-start",
                        marginTop: "4px",
                        paddingLeft: "2px",
                      }}
                    >
                      <RatingButtons
                        messageId={message.id}
                        index={index}
                        content={message.content}
                        ratings={ratings}
                        onRate={handleRate}
                      />
                    </div>
                  )}
                </div>
              )
            })}

            {/* Streaming bubble */}
            {streamingText && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div style={proxieBubble}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingText}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Typing indicator */}
            {isLoading && !streamingText && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    background: "#f4f2ee",
                    borderRadius: "12px 12px 12px 3px",
                    padding: "10px 14px",
                    display: "flex",
                    gap: "4px",
                    alignItems: "center",
                  }}
                >
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#bbb",
                        animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                  {phaseLabel && (
                    <span
                      style={{
                        fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                        fontSize: "10px",
                        color: "#aaa",
                        marginLeft: "6px",
                      }}
                    >
                      {phaseLabel}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div
            style={{
              padding: "10px 12px",
              borderTop: "1px solid #f0ede8",
              display: "flex",
              gap: "8px",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              placeholder={`Ask about ${PERSONAL_INFO.name}...`}
              disabled={isLoading}
              style={{
                flex: 1,
                border: "1px solid #e8e6e0",
                borderRadius: "8px",
                padding: "8px 12px",
                fontSize: "13px",
                fontFamily: "'DM Sans', sans-serif",
                color: "#111",
                outline: "none",
                background: "#fafaf8",
              }}
            />
            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              style={{
                background: "#111",
                border: "none",
                borderRadius: "8px",
                padding: "8px 12px",
                color: "#fff",
                fontSize: "14px",
                cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                opacity: isLoading || !input.trim() ? 0.4 : 1,
                transition: "opacity 0.15s ease",
              }}
              aria-label="Send"
            >
              ↑
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          background: isOpen ? "#f4f2ee" : "#111",
          border: isOpen ? "1px solid #e8e6e0" : "none",
          borderRadius: "28px",
          padding: "0 16px",
          height: "48px",
          minWidth: "48px",
          boxShadow: isOpen ? "none" : "0 4px 20px rgba(0,0,0,0.18)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 50,
          transition: "all 0.25s ease",
        }}
        aria-label={isOpen ? "Close chat" : "Chat with Proxie"}
      >
        {isOpen ? (
          <span
            style={{
              fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
              fontSize: "11px",
              color: "#888",
            }}
          >
            close
          </span>
        ) : (
          <>
            <span
              style={{
                fontFamily: "var(--font-dm-mono), 'DM Mono', monospace",
                fontSize: "11px",
                color: "#fff",
                letterSpacing: "0.03em",
                whiteSpace: "nowrap",
              }}
            >
              Ask Proxie
            </span>
            <div style={{ display: "flex", gap: "3px", alignItems: "center" }}>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "#fff",
                    opacity: 0.7,
                    animation: `typingDot 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          </>
        )}
      </button>

      <FeedbackDialog
        open={feedbackDialog?.open ?? false}
        onOpenChange={(open) => {
          if (!open) handleFeedbackCancel()
        }}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  )
}

// ─── RatingButtons ────────────────────────────────────────────────────────────

function RatingButtons({
  messageId,
  index,
  content,
  ratings,
  onRate,
}: {
  messageId: string
  index: number
  content: string
  ratings: Record<string, Rating>
  onRate: (id: string, rating: Rating, index?: number, content?: string) => void
}) {
  return (
    <div style={{ display: "flex", gap: "4px" }}>
      <button
        onClick={() => onRate(messageId, "up", index, content)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "4px",
          border: "none",
          background: ratings[messageId] === "up" ? "rgba(45,156,94,0.12)" : "transparent",
          color: ratings[messageId] === "up" ? "#2d9c5e" : "#ccc",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        aria-label="Rate helpful"
      >
        <ThumbsUp style={{ width: "11px", height: "11px" }} />
      </button>
      <button
        onClick={() => onRate(messageId, "down", index, content)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "22px",
          height: "22px",
          borderRadius: "4px",
          border: "none",
          background: ratings[messageId] === "down" ? "rgba(176,125,46,0.12)" : "transparent",
          color: ratings[messageId] === "down" ? "#b07d2e" : "#ccc",
          cursor: "pointer",
          transition: "all 0.15s ease",
        }}
        aria-label="Rate unhelpful"
      >
        <ThumbsDown style={{ width: "11px", height: "11px" }} />
      </button>
    </div>
  )
}
