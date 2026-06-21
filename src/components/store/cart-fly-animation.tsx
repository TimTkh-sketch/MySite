"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface FlyItem {
  id: string
  fromX: number
  fromY: number
  toX: number
  toY: number
  image?: string
}

export function CartFlyAnimation() {
  const [items, setItems] = useState<FlyItem[]>([])

  useEffect(() => {
    const handler = (e: Event) => {
      const { x, y, image } = (e as CustomEvent<{ x: number; y: number; image?: string }>).detail

      const cartBtn = document.querySelector("[data-cart-button]")
      if (!cartBtn) return
      const to = cartBtn.getBoundingClientRect()

      const item: FlyItem = {
        id: Math.random().toString(36).slice(2),
        fromX: x,
        fromY: y,
        toX: to.left + to.width / 2,
        toY: to.top  + to.height / 2,
        image,
      }

      setItems(prev => [...prev, item])
      setTimeout(() => setItems(prev => prev.filter(i => i.id !== item.id)), 850)
    }

    window.addEventListener("cart-fly", handler)
    return () => window.removeEventListener("cart-fly", handler)
  }, [])

  return (
    <div className="fixed inset-0 z-[9990] pointer-events-none overflow-hidden">
      <AnimatePresence>
        {items.map(item => {
          const midX = (item.fromX + item.toX) / 2
          const midY = Math.min(item.fromY, item.toY) - 100

          return (
            <motion.div
              key={item.id}
              className="absolute w-11 h-11 rounded-xl overflow-hidden shadow-xl bg-white border border-[#f0f0f0]"
              style={{ top: 0, left: 0 }}
              initial={{ x: item.fromX - 22, y: item.fromY - 22, scale: 1, opacity: 1 }}
              animate={{
                x: [item.fromX - 22, midX - 22, item.toX - 22],
                y: [item.fromY - 22, midY - 22, item.toY - 22],
                scale: [1, 0.7, 0.15],
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.75, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              {item.image && (
                <img src={item.image} alt="" className="w-full h-full object-contain p-1.5" />
              )}
              {!item.image && (
                <div className="w-full h-full rounded-xl bg-[#F26522]" />
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
