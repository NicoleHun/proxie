"use client"

import Image from "next/image"
import { useRef } from "react"
import { Camera } from "lucide-react"
import { useEditContext, FONT_OPTIONS } from "./edit-context"

export function HeroSection() {
  const {
    isEditMode,
    profileImage,
    setProfileImage,
    name,
    setName,
    summary,
    setSummary,
    secondParagraph,
    setSecondParagraph,
    headingFont,
    bodyFont,
  } = useEditContext()

  const fileInputRef = useRef<HTMLInputElement>(null)

  const headingFontClass = FONT_OPTIONS.find((f) => f.value === headingFont)?.className ?? "font-serif"
  const bodyFontClass = FONT_OPTIONS.find((f) => f.value === bodyFont)?.className ?? "font-sans"

  function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const result = event.target?.result
      if (typeof result === "string") {
        setProfileImage(result)
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <section className="flex flex-col items-center gap-10 px-6 py-16 md:flex-row md:items-start md:gap-16">
      {/* Profile Picture */}
      <div className="flex-shrink-0">
        <div
          className={`group relative h-52 w-44 overflow-hidden rounded-[50%] border-4 border-primary/20 shadow-lg md:h-64 md:w-52 ${
            isEditMode ? "cursor-pointer" : ""
          }`}
          onClick={() => isEditMode && fileInputRef.current?.click()}
          role={isEditMode ? "button" : undefined}
          tabIndex={isEditMode ? 0 : undefined}
          aria-label={isEditMode ? "Click to change profile photo" : undefined}
          onKeyDown={(e) => {
            if (isEditMode && (e.key === "Enter" || e.key === " ")) {
              fileInputRef.current?.click()
            }
          }}
        >
          <Image
            src={profileImage}
            alt="Profile photo"
            fill
            sizes="(max-width: 768px) 176px, 208px"
            className="object-cover"
            priority
            unoptimized={profileImage.startsWith("data:")}
          />
          {isEditMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-colors group-hover:bg-foreground/30">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background/80 opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                <Camera className="h-5 w-5 text-foreground" />
              </div>
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      {/* Summary */}
      <div className="flex flex-col gap-4 text-center md:text-left">
        {isEditMode ? (
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`${headingFontClass} border-b-2 border-dashed border-primary/30 bg-transparent text-3xl font-semibold tracking-tight text-foreground outline-none focus:border-primary md:text-4xl`}
          />
        ) : (
          <h1
            className={`${headingFontClass} text-3xl font-semibold tracking-tight text-foreground md:text-4xl text-balance`}
          >
            {name}
          </h1>
        )}

        {isEditMode ? (
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            className={`${bodyFontClass} resize-none rounded-lg border border-dashed border-primary/30 bg-transparent p-2 text-lg leading-relaxed text-muted-foreground outline-none focus:border-primary`}
          />
        ) : (
          <p className={`${bodyFontClass} text-lg leading-relaxed text-muted-foreground`}>
            {summary}
          </p>
        )}

        {isEditMode ? (
          <textarea
            value={secondParagraph}
            onChange={(e) => setSecondParagraph(e.target.value)}
            rows={3}
            className={`${bodyFontClass} resize-none rounded-lg border border-dashed border-primary/30 bg-transparent p-2 text-base leading-relaxed text-muted-foreground outline-none focus:border-primary`}
          />
        ) : (
          <p className={`${bodyFontClass} text-base leading-relaxed text-muted-foreground`}>
            {secondParagraph}
          </p>
        )}
      </div>
    </section>
  )
}
