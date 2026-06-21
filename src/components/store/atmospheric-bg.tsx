"use client"

import { useEffect, useRef } from "react"

export function AtmosphericBackground() {
  const bgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let rafId: number
    let currentX = 0
    let currentY = 0
    let targetX = 0
    let targetY = 0

    const onMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 18
      targetY = (e.clientY / window.innerHeight - 0.5) * 14
    }

    const tick = () => {
      currentX += (targetX - currentX) * 0.06
      currentY += (targetY - currentY) * 0.06
      if (bgRef.current) {
        bgRef.current.style.transform = `translate(${currentX}px, ${currentY}px) scale(1.07)`
      }
      rafId = requestAnimationFrame(tick)
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    rafId = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={bgRef}
      className="fixed inset-0 -z-10 pointer-events-none will-change-transform"
      style={{
        background: `
          radial-gradient(ellipse 120% 55% at 50% 0%,   rgba(242,101,34,0.07) 0%, transparent 60%),
          radial-gradient(ellipse 60%  50% at 0%  50%,   rgba(242,101,34,0.04) 0%, transparent 55%),
          radial-gradient(ellipse 50%  45% at 100% 40%,  rgba(242,101,34,0.03) 0%, transparent 50%),
          #ffffff
        `,
      }}
    />
  )
}
