"use client"

import { useEffect, useRef, type MouseEvent } from "react"

/**
 * The interaction mechanics shared by QuickViewModal and CartDrawer:
 * focus-in on open, body scroll lock, Escape to close, a scoped Tab cycle,
 * and backdrop-click-to-close. Deliberately narrow — it doesn't render
 * anything (each dialog still owns its own portal/markup/aria attributes)
 * and doesn't handle focus-return-to-trigger, since that's specific to
 * each trigger, not the dialog itself.
 */
export function useDialog<T extends HTMLElement>(onClose: () => void) {
  const containerRef = useRef<T>(null)
  const initialFocusRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    initialFocusRef.current?.focus()
  }, [])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
        return
      }

      if (event.key !== "Tab" || !containerRef.current) return

      const focusable = getFocusableElements(containerRef.current)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  function handleBackdropClick(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  return { containerRef, initialFocusRef, handleBackdropClick }
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )
  )
}
