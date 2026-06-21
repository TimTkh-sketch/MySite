"use client"

import { useEffect, useRef, useState } from "react"

interface Props {
  target: number
  suffix?: string
  duration?: number
  className?: string
}

export function CountUp({ target, suffix = "", duration = 1600, className = "" }: Props) {
  const [count, setCount] = useState(0)
  const [started, setStarted] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          observer.disconnect()
          let start = 0
          const step = target / (duration / 16)
          const timer = setInterval(() => {
            start += step
            if (start >= target) {
              setCount(target)
              clearInterval(timer)
            } else {
              setCount(Math.floor(start))
            }
          }, 16)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, started])

  return (
    <span ref={ref} className={className}>
      {count.toLocaleString("ru-RU")}{suffix}
    </span>
  )
}
