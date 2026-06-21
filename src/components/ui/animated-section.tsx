"use client"

import { motion } from "framer-motion"

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: "up" | "left" | "scale"
}

export function AnimatedSection({ children, delay = 0, className, direction = "up" }: Props) {
  const variants = {
    up:    { hidden: { opacity: 0, y: 32 },        visible: { opacity: 1, y: 0 } },
    left:  { hidden: { opacity: 0, x: -32 },       visible: { opacity: 1, x: 0 } },
    scale: { hidden: { opacity: 0, scale: 0.92 },  visible: { opacity: 1, scale: 1 } },
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={variants[direction]}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
