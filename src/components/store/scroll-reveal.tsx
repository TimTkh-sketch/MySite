"use client"

import { useEffect, useRef } from "react"

type RevealType = "up" | "left" | "scale"

interface Props {
  children: React.ReactNode
  delay?: number
  type?: RevealType
  className?: string
  threshold?: number
}

const typeClass: Record<RevealType, string> = {
  up:    "reveal",
  left:  "reveal-left",
  scale: "reveal-scale",
}

export function ScrollReveal({ children, delay = 0, type = "up", className = "", threshold = 0.12 }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.transitionDelay = `${delay}ms`
          el.classList.add("is-visible")
          observer.disconnect()
        }
      },
      { threshold }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay, threshold])

  return (
    <div ref={ref} className={`${typeClass[type]} ${className}`}>
      {children}
    </div>
  )
}
