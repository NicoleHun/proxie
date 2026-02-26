"use client"

import { useState, useRef, useEffect } from "react"
import { Send, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { PERSONAL_INFO } from "@/lib/constants"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import Image from "next/image"
import { FeedbackDialog } from "@/components/feedback-dialog"

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

export function Chatbot() {
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

  useEffect(() => {
    const id = crypto.randomUUID()
    setSessionId(id)
  }, [])

  useEffect(() => {
    if (!messagesEndRef.current) return
    // Avoid auto-scrolling the whole page on initial load
    if (messages.length === 0 && !streamingText) return
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingText])

  async function handleRate(messageId: string, rating: Rating, index?: number, messageContent?: string) {
    if (!sessionId || index === undefined) return

    const newRating = ratings[messageId] === rating ? null : rating
    setRatings((prev) => ({
      ...prev,
      [messageId]: newRating,
    }))

    if (!newRating) return

    const telemetry = messageTelemetry[messageId] ?? {}

    if (newRating === "down") {
      // Open feedback dialog instead of immediately posting
      setFeedbackDialog({
        open: true,
        messageId,
        index,
        messageContent: messageContent ?? "",
        telemetry,
      })
      return
    }

    // Thumbs up: post immediately
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
          reason: reason,
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
    // Revert the optimistic thumbs-down state
    setRatings((prev) => ({
      ...prev,
      [feedbackDialog.messageId]: null,
    }))
    setFeedbackDialog(null)
  }

  async function handleStreamingSubmit(userInput: string, sendTime: number) {
    const response = await fetch(`/api/chat?mode=${LATENCY_MODE}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userInput, session_id: sessionId }),
    })

    if (!response.ok || !response.body) {
      throw new Error(`HTTP ${response.status}`)
    }

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
              const assistantMessage: Message = {
                id: msgId,
                role: "assistant",
                content: accumulated,
              }
              setMessages((prev) => [...prev, assistantMessage])
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
            // non-JSON data line — ignore
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
      const assistantMessage: Message = {
        id: msgId,
        role: "assistant",
        content: data.reply,
      }
      setMessages((prev) => [...prev, assistantMessage])
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading || !sessionId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

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
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again later.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // ── Status label shown during tool-fetching phase ─────────────────────────
  const phaseLabel = streamPhase === "fetching"
    ? "Looking up Nicole's info..."
    : streamPhase === "thinking"
      ? "Thinking..."
      : null

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/80">
            <Image
              src="/proxie-avatar.png"
              alt="Proxie Avatar"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Chat with {PERSONAL_INFO.proxie.name}
            </h2>
            <p className="text-sm text-muted-foreground">
              {`${PERSONAL_INFO.name}'s career digital twin — ask me anything!`}
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Messages Area */}
          <div className="h-[518px] overflow-y-auto p-4">
            {/* Opening Message */}
            <div className="mb-5 flex items-end gap-2.5">
              <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/80">
                <Image
                  src="/proxie-avatar.png"
                  alt="Proxie Avatar"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="mb-1 px-1 text-xs text-muted-foreground">
                  {PERSONAL_INFO.proxie.name}
                </span>
                <div
                  className="rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
                  style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal', maxWidth: '60%', display: 'inline-block' }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {PERSONAL_INFO.proxie.greeting}
                  </ReactMarkdown>
                </div>

                {/* Thumbs Up / Down for opening message */}
                <div className="mt-1.5 flex items-center gap-1 px-1">
                  <button
                    onClick={() => handleRate("opening-message", "up", -1, PERSONAL_INFO.proxie.greeting)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${ratings["opening-message"] === "up"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                      }`}
                    aria-label="Rate helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRate("opening-message", "down", -1, PERSONAL_INFO.proxie.greeting)}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${ratings["opening-message"] === "down"
                      ? "bg-destructive/15 text-destructive"
                      : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                      }`}
                    aria-label="Rate unhelpful"
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* User Messages */}
            <div className="flex flex-col gap-5">
              {messages.map((message, index) => {
                const isUser = message.role === "user"

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2.5 ${isUser ? "flex-row-reverse" : ""
                      }`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/80">
                        <Image
                          src="/proxie-avatar.png"
                          alt="Proxie Avatar"
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Bubble + Rating */}
                    <div
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"
                        }`}
                      style={{ maxWidth: '60%' }}
                    >
                      {/* Label */}
                      <span className="mb-1 px-1 text-xs text-muted-foreground">
                        {isUser ? "You" : PERSONAL_INFO.proxie.name}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${isUser
                          ? "rounded-br-md bg-primary text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground prose-a:text-primary-foreground"
                          : "rounded-bl-md bg-secondary text-secondary-foreground prose-headings:text-secondary-foreground prose-strong:text-secondary-foreground prose-code:text-secondary-foreground prose-a:text-secondary-foreground"
                          }`}
                        style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Thumbs Up / Down for assistant messages */}
                      {!isUser && (
                        <div className="mt-1.5 flex items-center gap-1 px-1">
                          <button
                            onClick={() => handleRate(message.id, "up", index, message.content)}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${ratings[message.id] === "up"
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                              }`}
                            aria-label="Rate helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRate(message.id, "down", index, message.content)}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${ratings[message.id] === "down"
                              ? "bg-destructive/15 text-destructive"
                              : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                              }`}
                            aria-label="Rate unhelpful"
                          >
                            <ThumbsDown className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* ── Option 1: Streaming response bubble ───────────────────── */}
              {streamingText && (
                <div className="flex items-end gap-2.5">
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/80">
                    <Image
                      src="/proxie-avatar.png"
                      alt="Proxie Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start" style={{ maxWidth: '60%' }}>
                    <span className="mb-1 px-1 text-xs text-muted-foreground">
                      {PERSONAL_INFO.proxie.name}
                    </span>
                    <div
                      className="rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
                      style={{ wordBreak: 'normal', overflowWrap: 'break-word', whiteSpace: 'normal' }}
                    >
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {streamingText}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator (shown during thinking/fetching, or non-streaming loading) */}
              {isLoading && !streamingText && (
                <div className="flex items-end gap-2.5">
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/80">
                    <Image
                      src="/proxie-avatar.png"
                      alt="Proxie Avatar"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="mb-1 px-1 text-xs text-muted-foreground">
                      {PERSONAL_INFO.proxie.name}
                    </span>
                    <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                          <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
                        </div>
                        {phaseLabel && (
                          <span className="text-xs text-muted-foreground/70 italic">
                            {phaseLabel}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask ${PERSONAL_INFO.proxie.name} about ${PERSONAL_INFO.name}'s experience, skills...`}
                disabled={isLoading}
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>

      <FeedbackDialog
        open={feedbackDialog?.open ?? false}
        onOpenChange={(open) => { if (!open) handleFeedbackCancel() }}
        onSubmit={handleFeedbackSubmit}
      />
    </section>
  )
}
