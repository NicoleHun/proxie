"use client"

import { useState, useRef, useEffect } from "react"
import { Send, ThumbsUp, ThumbsDown, User } from "lucide-react"
import { PERSONAL_INFO } from "@/lib/constants"

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
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function handleRate(messageId: string, rating: Rating) {
    setRatings((prev) => ({
      ...prev,
      [messageId]: prev[messageId] === rating ? null : rating,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // TODO: Replace this with your own backend API call
    // Example:
    // const response = await fetch("/api/your-chat-endpoint", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ messages: [...messages, userMessage] }),
    // })
    // const data = await response.json()

    // Placeholder response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Chat functionality is currently being set up. Please connect this to your backend API.",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <section className="px-6 py-10">
      <div className="mx-auto max-w-2xl">
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
          <div className="h-96 overflow-y-auto p-4">
            {/* Opening Message */}
            <div className="mb-5 flex items-end gap-2.5">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/80 bg-primary text-xs font-semibold text-primary-foreground">
                P
              </div>
              <div className="flex flex-col items-start">
                <span className="mb-1 px-1 text-xs text-muted-foreground">
                  {PERSONAL_INFO.proxie.name}
                </span>
                <div className="min-w-[4rem] max-w-md rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground">
                  {PERSONAL_INFO.proxie.greeting}
                </div>

                {/* Thumbs Up / Down for opening message */}
                <div className="mt-1.5 flex items-center gap-1 px-1">
                  <button
                    onClick={() => handleRate("opening-message", "up")}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                      ratings["opening-message"] === "up"
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground/50 hover:bg-secondary hover:text-foreground"
                    }`}
                    aria-label="Rate helpful"
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleRate("opening-message", "down")}
                    className={`flex h-6 w-6 items-center justify-center rounded-md transition-colors ${
                      ratings["opening-message"] === "down"
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
              {messages.map((message) => {
                const isUser = message.role === "user"

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
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border-2 border-primary/80 bg-primary text-xs font-semibold text-primary-foreground">
                        P
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
                        {isUser ? "You" : PERSONAL_INFO.proxie.name}
                      </span>

                      {/* Message Bubble */}
                      <div
                        className={`min-w-[4rem] max-w-md rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                          isUser
                            ? "rounded-br-md bg-primary text-primary-foreground"
                            : "rounded-bl-md bg-secondary text-secondary-foreground"
                        }`}
                      >
                        {message.content}
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
