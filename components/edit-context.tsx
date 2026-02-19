"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useLocalStorage } from "@/hooks/use-local-storage"

export type FontOption = "dm-sans" | "inter" | "lora" | "playfair"

export const FONT_OPTIONS: { value: FontOption; label: string; className: string }[] = [
  { value: "dm-sans", label: "DM Sans", className: "font-sans" },
  { value: "inter", label: "Inter", className: "font-[family-name:var(--font-inter)]" },
  { value: "lora", label: "Lora", className: "font-serif" },
  { value: "playfair", label: "Playfair Display", className: "font-[family-name:var(--font-playfair)]" },
]

interface EditContextType {
  isEditMode: boolean
  setIsEditMode: (v: boolean) => void
  profileImage: string
  setProfileImage: (v: string) => void
  name: string
  setName: (v: string) => void
  summary: string
  setSummary: (v: string) => void
  secondParagraph: string
  setSecondParagraph: (v: string) => void
  email: string
  setEmail: (v: string) => void
  headingFont: FontOption
  setHeadingFont: (v: FontOption) => void
  bodyFont: FontOption
  setBodyFont: (v: FontOption) => void
}

const EditContext = createContext<EditContextType | null>(null)

export function useEditContext() {
  const ctx = useContext(EditContext)
  if (!ctx) throw new Error("useEditContext must be used within EditProvider")
  return ctx
}

export function EditProvider({ children }: { children: ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [profileImage, setProfileImage] = useLocalStorage<string>("portfolio-profile-image", "/images/profile.jpg")
  const [name, setName] = useLocalStorage<string>("portfolio-name", "Hello, I'm Your Name")
  const [summary, setSummary] = useLocalStorage<string>(
    "portfolio-summary",
    "I'm a creative professional passionate about building meaningful digital experiences. With a background spanning design, development, and strategy, I bring ideas to life through thoughtful craft and attention to detail."
  )
  const [secondParagraph, setSecondParagraph] = useLocalStorage<string>(
    "portfolio-second-paragraph",
    "Currently exploring the intersection of technology and human connection. When I'm not working, you'll find me reading, traveling, or experimenting with new creative tools."
  )
  const [email, setEmail] = useLocalStorage<string>("portfolio-email", "hello@example.com")
  const [headingFont, setHeadingFont] = useLocalStorage<FontOption>("portfolio-heading-font", "lora")
  const [bodyFont, setBodyFont] = useLocalStorage<FontOption>("portfolio-body-font", "dm-sans")

  return (
    <EditContext.Provider
      value={{
        isEditMode,
        setIsEditMode,
        profileImage,
        setProfileImage,
        name,
        setName,
        summary,
        setSummary,
        secondParagraph,
        setSecondParagraph,
        email,
        setEmail,
        headingFont,
        setHeadingFont,
        bodyFont,
        setBodyFont,
      }}
    >
      {children}
    </EditContext.Provider>
  )
}
