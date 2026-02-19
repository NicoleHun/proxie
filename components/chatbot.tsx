"use client"

import { useState, useRef, useEffect } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { Send, MessageCircle, ThumbsUp, ThumbsDown, User } from "lucide-react"
import Image from "next/image"

type Rating = "up" | "down" | null

export function Chatbot() {
  const [input, setInput] = useState("")
  const [ratings, setRatings] = useState<Record<string, Rating>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  })

  const isLoading = status === "streaming" || status === "submitted"

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleRate(messageId: string, rating: Rating) {
    setRatings((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === rating ? null : rating,
    }))
  }

  function getMessageText(parts: Array<{ type: string; text?: string }>) {
    return parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("")
  }

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border-2 border-primary/20">
            <Image
              src="/images/proxie-avatar.jpg"
              alt="Proxie avatar"
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              Chat with Proxie
            </h2>
            <p className="text-sm text-muted-foreground">
              Curious about my experience? Start a conversation below.
            </p>
          </div>
        </div>

        {/* Chat Container */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {/* Messages Area */}
          <div className="h-96 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                <div className="relative h-16 w-16 overflow-hidden rounded-full border-2 border-primary/20">
                  <Image
                    src="/images/proxie-avatar.jpg"
                    alt="Proxie avatar"
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                <div>
                  <p className="mb-1 text-sm font-medium text-foreground">
                    Proxie
                  </p>
                  <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                    {"Hi! I'm Proxie. Ask me about work experience, skills, projects, or anything you'd like to know."}
                  </p>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-5">
              {messages.map((message) => {
                const isUser = message.role === "user"
                const text = getMessageText(
                  message.parts as Array<{ type: string; text?: string }>
                )

                return (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2.5 ${
                      isUser ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    {isUser ? (
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <User className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-border">
                        <Image
                          src="/images/proxie-avatar.jpg"
                          alt="Proxie"
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    )}

                    {/* Bubble + Rating */}
                    <div
                      className={`flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      {/* Label */}
                      <span className="mb-1 px-1 text-xs text-muted-foreground">
                        {isUser ? "You" : "Proxie"}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`max-w-[min(75%,20rem)] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {text}
                      </div>

                      {/* Thumbs Up / Down for assistant messages */}
                      {!isUser && (
                        <div className="mt-1.5 flex items-center gap-1 px-1">
                          <button
                            onClick={() => handleRate(message.id, "up")}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                              ratings[message.id] === "up"
                                ? "bg-primary/15 text-primary"
                                : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                            }`}
                            aria-label="Rate helpful"
                          >
                            <ThumbsUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleRate(message.id, "down")}
                            className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                              ratings[message.id] === "down"
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
              {isLoading && messages[messages.length - 1]?.role === "user" && (
                <div className="flex items-end gap-2.5">
                  <div className="relative h-8 w-8 flex-shrink-0 overflow-hidden rounded-full border border-border">
                    <Image
                      src="/images/proxie-avatar.jpg"
                      alt="Proxie"
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex flex-col items-start">
                    <span className="mb-1 px-1 text-xs text-muted-foreground">
                      Proxie
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
            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!input.trim() || isLoading) return
                sendMessage({ text: input })
                setInput("")
              }}
              className="flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Proxie about my experience, skills..."
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
