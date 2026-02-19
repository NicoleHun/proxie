"use client"

import { useState, useEffect, useCallback } from "react"

function readStorage<T>(key: string, defaultValue: T): T {
  try {
    // Check localStorage first, then sessionStorage (for large values like base64 images)
    const stored = localStorage.getItem(key) ?? sessionStorage.getItem(key)
    if (stored !== null) {
      return JSON.parse(stored) as T
    }
  } catch {
    // ignore errors
  }
  return defaultValue
}

function writeStorage(key: string, value: string): void {
  try {
    // If value is large (> 3MB), use sessionStorage to avoid quota errors
    if (value.length > 3 * 1024 * 1024) {
      sessionStorage.setItem(key, value)
      // Remove from localStorage if it was there before
      localStorage.removeItem(key)
    } else {
      localStorage.setItem(key, value)
    }
  } catch {
    // quota exceeded -- fallback to sessionStorage
    try {
      sessionStorage.setItem(key, value)
    } catch {
      // truly out of space
    }
  }
}

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(defaultValue)

  // Hydrate from storage after mount (SSR renders with defaultValue)
  useEffect(() => {
    setValue(readStorage(key, defaultValue))
  }, [key, defaultValue])

  const setStoredValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = newValue instanceof Function ? newValue(prev) : newValue
        writeStorage(key, JSON.stringify(resolved))
        return resolved
      })
    },
    [key]
  )

  return [value, setStoredValue]
}
