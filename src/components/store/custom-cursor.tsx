"use client"

import { useEffect, useRef, useState } from "react"

export interface CursorConfig {
  enabled: boolean
  color: string
  size: number
  blendMode: "difference" | "normal"
  ringEnabled: boolean
}

export function CustomCursor({ config }: { config: CursorConfig }) {
  const dotRef  = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const [visible,  setVisible]  = useState(false)
  const [hovering, setHovering] = useState(false)
  const mouse = useRef({ x: -200, y: -200 })
  const dot   = useRef({ x: -200, y: -200 })
  const ring  = useRef({ x: -200, y: -200 })
  const raf   = useRef<number>(0)

  useEffect(() => {
    if (!config.enabled) return
    if (typeof window === "undefined") return
    if (window.matchMedia("(pointer: coarse)").matches) return
    // eslint-disable-next-line react-hooks/exhaustive-deps

    document.documentElement.classList.add("cursor-none")

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const tick = () => {
      dot.current.x  = lerp(dot.current.x,  mouse.current.x, 0.9)
      dot.current.y  = lerp(dot.current.y,  mouse.current.y, 0.9)
      ring.current.x = lerp(ring.current.x, mouse.current.x, 0.12)
      ring.current.y = lerp(ring.current.y, mouse.current.y, 0.12)

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${dot.current.x}px, ${dot.current.y}px) translate(-50%, -50%)`
      }
      if (ringRef.current) {
        ringRef.current.style.transform =
          `translate(${ring.current.x}px, ${ring.current.y}px) translate(-50%, -50%)`
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)

    const onMove  = (e: MouseEvent) => { mouse.current = { x: e.clientX, y: e.clientY }; setVisible(true) }
    const onLeave = () => setVisible(false)
    const onEnter = () => setVisible(true)

    const addHover = () => setHovering(true)
    const removeHover = () => setHovering(false)

    const bindInteractive = () => {
      document.querySelectorAll("a, button, [role=button], input, select, textarea, label").forEach(el => {
        el.addEventListener("mouseenter", addHover)
        el.addEventListener("mouseleave", removeHover)
      })
    }
    bindInteractive()

    const observer = new MutationObserver(bindInteractive)
    observer.observe(document.body, { childList: true, subtree: true })

    window.addEventListener("mousemove", onMove, { passive: true })
    document.addEventListener("mouseleave", onLeave)
    document.addEventListener("mouseenter", onEnter)

    return () => {
      document.documentElement.classList.remove("cursor-none")
      window.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseleave", onLeave)
      document.removeEventListener("mouseenter", onEnter)
      observer.disconnect()
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [config.enabled])

  if (!config.enabled) return null

  const dotSize  = config.size
  const ringSize = dotSize * 3.6

  return (
    <>
      {/* Dot */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] rounded-full will-change-transform"
        style={{
          width: dotSize,
          height: dotSize,
          background: config.color,
          mixBlendMode: config.blendMode,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.15s",
        }}
      />

      {/* Ring */}
      {config.ringEnabled && (
        <div
          ref={ringRef}
          className="fixed top-0 left-0 pointer-events-none z-[9998] rounded-full will-change-transform"
          style={{
            width:  hovering ? ringSize * 1.7 : ringSize,
            height: hovering ? ringSize * 1.7 : ringSize,
            border: `1.5px solid ${config.color}`,
            opacity: visible ? (hovering ? 0.55 : 0.3) : 0,
            transition: "opacity 0.15s, width 0.25s ease, height 0.25s ease",
          }}
        />
      )}
    </>
  )
}
