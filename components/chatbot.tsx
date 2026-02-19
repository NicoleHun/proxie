"use client"

import { useState, useRef, useEffect } from "react"
import { Send, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { PERSONAL_INFO } from "@/lib/constants"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

type Rating = "up" | "down" | null

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export function Chatbot() {
  const [input, setInput] = useState("")
  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Initialize or retrieve session ID
    let id = localStorage.getItem("proxie_session_id")
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem("proxie_session_id", id)
    }
    setSessionId(id)

    // Load existing messages if any
    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/session?session_id=${id}`)
        if (res.ok) {
          const data = await res.json()
          if (data.conversation_history) {
            setMessages(data.conversation_history.map((m: any, i: number) => ({
              id: `msg-${i}`,
              role: m.role,
              content: m.content
            })))
          }
        }
      } catch (err) {
        console.error("Failed to fetch session:", err)
      }
    }
    fetchSession()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function handleRate(messageId: string, rating: Rating, index?: number) {
    if (!sessionId || index === undefined) return

    const newRating = ratings[messageId] === rating ? null : rating
    setRatings((prev) => ({
      ...prev,
      [messageId]: newRating,
    }))

    if (newRating) {
      try {
        await fetch("/api/rating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            message_index: index,
            rating: newRating === "up" ? "thumbs_up" : "thumbs_down"
          }),
        })
      } catch (err) {
        console.error("Failed to submit rating:", err)
      }
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
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          session_id: sessionId
        }),
      })

      const data = await response.json()

      if (data.reply) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.reply,
        }
        setMessages((prev) => [...prev, assistantMessage])
      } else {
        throw new Error(data.error || "Failed to get reply")
      }
    } catch (err) {
      console.error("Chat error:", err)
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

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/80 bg-primary font-semibold text-primary-foreground">
            P
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
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/80 bg-primary text-xs font-semibold text-primary-foreground">
                P
              </div>
              <div className="flex flex-col items-start">
                <span className="mb-1 px-1 text-xs text-muted-foreground">
                  {PERSONAL_INFO.proxie.name}
                </span>
                <div 
                  className="max-w-[60%] rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0"
                  style={{ width: 'fit-content' }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {PERSONAL_INFO.proxie.greeting}
                  </ReactMarkdown>
                </div>

                {/* Thumbs Up / Down for opening message */}
                <div className="mt-1.5 flex items-center gap-1 px-1">
                  <button
                    onClick={() => handleRate("opening-message", "up")}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${ratings["opening-message"] === "up"
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                      }`}
                    aria-label="Rate helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRate("opening-message", "down")}
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
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/80 bg-primary text-xs font-semibold text-primary-foreground">
                        P
                      </div>
                    )}

                    {/* Bubble + Rating */}
                    <div
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"
                        }`}
                    >
                      {/* Label */}
                      <span className="mb-1 px-1 text-xs text-muted-foreground">
                        {isUser ? "You" : PERSONAL_INFO.proxie.name}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[60%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed prose prose-sm prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 ${
                          isUser
                            ? "rounded-br-md bg-primary text-primary-foreground prose-headings:text-primary-foreground prose-strong:text-primary-foreground prose-code:text-primary-foreground prose-a:text-primary-foreground"
                            : "rounded-bl-md bg-secondary text-secondary-foreground prose-headings:text-secondary-foreground prose-strong:text-secondary-foreground prose-code:text-secondary-foreground prose-a:text-secondary-foreground"
                        }`}
                        style={{ width: 'fit-content' }}
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {/* Thumbs Up / Down for assistant messages */}
                      {!isUser && (
                        <div className="mt-1.5 flex items-center gap-1 px-1">
                          <button
                            onClick={() => handleRate(message.id, "up", index)}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${ratings[message.id] === "up"
                              ? "bg-primary/15 text-primary"
                              : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                              }`}
                            aria-label="Rate helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRate(message.id, "down", index)}
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

              {/* Typing indicator */}
              {isLoading && (
                <div className="flex items-end gap-2.5">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/80 bg-primary text-xs font-semibold text-primary-foreground">
                    P
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="mb-1 px-1 text-xs text-muted-foreground">
                      {PERSONAL_INFO.proxie.name}
                    </span>
                    <div className="rounded-2xl rounded-bl-md bg-secondary px-4 py-3">
                      <div className="flex gap-1.5">
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:0ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:150ms]" />
                        <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:300ms]" />
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
    </section>
  )
}
