"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const FEEDBACK_REASONS = [
  "UI Issue",
  "Lack of fluency and poorly articulated",
  "Didn't fully follow my request",
  "I don't like the tone",
  "Others",
]

interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: string | null, feedbackText: string) => void
}

export function FeedbackDialog({ open, onOpenChange, onSubmit }: FeedbackDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null)
  const [feedbackText, setFeedbackText] = useState("")

  function handleSubmit() {
    onSubmit(selectedReason, feedbackText)
    setSelectedReason(null)
    setFeedbackText("")
  }

  function handleCancel() {
    setSelectedReason(null)
    setFeedbackText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleCancel() }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>What went wrong?</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 py-1">
          {FEEDBACK_REASONS.map((reason) => (
            <button
              key={reason}
              onClick={() => setSelectedReason(selectedReason === reason ? null : reason)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                selectedReason === reason
                  ? "border-destructive bg-destructive/10 text-destructive"
                  : "border-border bg-background text-muted-foreground hover:border-foreground/40 hover:text-foreground"
              )}
            >
              {reason}
            </button>
          ))}
        </div>

        <textarea
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          placeholder="[Optional] Provide an example"
          rows={3}
          className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />

        <DialogFooter>
          <button
            onClick={handleCancel}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Submit
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
