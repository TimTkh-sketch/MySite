"use client"

import { useEffect } from "react"

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let lenisInstance: { raf: (t: number) => void; destroy: () => void } | null = null
    let rafId: number

    async function init() {
      const { default: Lenis } = await import("lenis")
      lenisInstance = new Lenis({
        duration: 1.35,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      } as ConstructorParameters<typeof Lenis>[0])

      function raf(time: number) {
        lenisInstance?.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)
    }

    init()
    return () => {
      cancelAnimationFrame(rafId)
      lenisInstance?.destroy()
    }
  }, [])

  return <>{children}</>
}
