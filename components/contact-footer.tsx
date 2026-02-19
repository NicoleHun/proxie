"use client"

import { Mail } from "lucide-react"
import { useEditContext } from "./edit-context"

export function ContactFooter() {
  const { isEditMode, email, setEmail } = useEditContext()

  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 text-center">
        <Mail className="h-5 w-5 text-primary" />
        {isEditMode ? (
          <div className="flex items-center gap-1.5 text-base text-muted-foreground">
            <span>{"Want to chat? My email is: "}</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-b-2 border-dashed border-primary/30 bg-transparent font-medium text-primary outline-none focus:border-primary"
            />
          </div>
        ) : (
          <p className="text-base text-muted-foreground">
            {"Want to chat? My email is: "}
            <a
              href={`mailto:${email}`}
              className="font-medium text-primary underline underline-offset-4 transition-colors hover:text-primary/80"
            >
              {email}
            </a>
          </p>
        )}
      </div>
    </footer>
  )
}
