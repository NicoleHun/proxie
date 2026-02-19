"use client"

import Link from "next/link"
import { Pencil, Check, Type } from "lucide-react"
import { useEditContext, FONT_OPTIONS, type FontOption } from "./edit-context"
import { useState, useRef, useEffect } from "react"

export function Navbar() {
  const { isEditMode, setIsEditMode, headingFont, setHeadingFont, bodyFont, setBodyFont } = useEditContext()
  const [showFontPicker, setShowFontPicker] = useState(false)
  const fontPickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fontPickerRef.current && !fontPickerRef.current.contains(e.target as Node)) {
        setShowFontPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-serif text-xl font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
        >
          Portfolio
        </Link>
        <div className="flex items-center gap-2">
          {/* Font picker - only visible in edit mode */}
          {isEditMode && (
            <div className="relative" ref={fontPickerRef}>
              <button
                onClick={() => setShowFontPicker(!showFontPicker)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground transition-colors hover:bg-secondary"
                aria-label="Change fonts"
              >
                <Type className="h-4 w-4" />
                <span className="hidden sm:inline">Fonts</span>
              </button>
              {showFontPicker && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-card p-4 shadow-lg">
                  <div className="mb-3">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Heading Font
                    </label>
                    <div className="flex flex-col gap-1">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={`heading-${font.value}`}
                          onClick={() => setHeadingFont(font.value as FontOption)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                            headingFont === font.value
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <span className={font.className}>{font.label}</span>
                          {headingFont === font.value && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-border pt-3">
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Body Font
                    </label>
                    <div className="flex flex-col gap-1">
                      {FONT_OPTIONS.map((font) => (
                        <button
                          key={`body-${font.value}`}
                          onClick={() => setBodyFont(font.value as FontOption)}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
                            bodyFont === font.value
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-foreground hover:bg-secondary"
                          }`}
                        >
                          <span className={font.className}>{font.label}</span>
                          {bodyFont === font.value && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Edit mode toggle */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isEditMode
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "text-foreground hover:bg-secondary hover:text-primary"
            }`}
            aria-label={isEditMode ? "Save changes" : "Edit page"}
          >
            {isEditMode ? (
              <>
                <Check className="h-4 w-4" />
                <span>Done</span>
              </>
            ) : (
              <>
                <Pencil className="h-4 w-4" />
                <span>Edit</span>
              </>
            )}
          </button>
        </div>
      </nav>
    </header>
  )
}
