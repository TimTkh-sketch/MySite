"use client"

import { Heart } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useWishlist } from "./wishlist-provider"

interface Props {
  productId: string
  className?: string
  size?: "sm" | "md"
}

export function WishlistButton({ productId, className = "", size = "sm" }: Props) {
  const { toggle, has } = useWishlist()
  const saved = has(productId)

  const dim = size === "md" ? "w-10 h-10" : "w-8 h-8"
  const iconDim = size === "md" ? "h-5 w-5" : "h-4 w-4"

  return (
    <button
      onClick={e => { e.preventDefault(); e.stopPropagation(); toggle(productId) }}
      title={saved ? "Убрать из избранного" : "В избранное"}
      className={`${dim} rounded-full flex items-center justify-center transition-all active:scale-90 ${
        saved
          ? "bg-[#fff3ee] text-[#F26522]"
          : "bg-white/80 text-[#bbb] hover:text-[#F26522] hover:bg-[#fff3ee]"
      } ${className}`}
      style={{ backdropFilter: "blur(8px)" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={saved ? "filled" : "empty"}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <Heart
            className={iconDim}
            fill={saved ? "currentColor" : "none"}
            strokeWidth={saved ? 0 : 2}
          />
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
