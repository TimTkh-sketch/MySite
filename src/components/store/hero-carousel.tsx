"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

interface Product {
  id: string; name: string; slug: string; price: number
  comparePrice?: number | null; images: string[]; stock: number
}

const INTERVAL = 5500

export function HeroCarousel({ products, storeSlug, storeName }: {
  products: Product[]; storeSlug: string; storeName: string
}) {
  const [current, setCurrent] = useState(0)
  const currentRef = useRef(0)
  const base = `/store/${storeSlug}`

  useEffect(() => {
    if (products.length < 2) return
    const id = setInterval(() => {
      const next = (currentRef.current + 1) % products.length
      currentRef.current = next
      setCurrent(next)
    }, INTERVAL)
    return () => clearInterval(id)
  }, [products.length])

  function goTo(i: number) {
    currentRef.current = i
    setCurrent(i)
  }

  const product = products[current]
  if (!product) return null

  const words = product.name.split(" ")
  const line1 = words.slice(0, Math.ceil(words.length / 2)).join(" ").toUpperCase()
  const line2 = words.slice(Math.ceil(words.length / 2)).join(" ").toUpperCase()

  return (
    <section className="relative overflow-hidden" style={{ minHeight: "100svh", background: "#000" }}>

      {/* Grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          maskImage: "radial-gradient(ellipse 80% 70% at 50% 50%, black 40%, transparent 100%)",
        }}
      />

      {/* Radial glow behind image */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current + "-glow"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute pointer-events-none"
          style={{
            right: "-5%",
            top: "10%",
            width: "55%",
            height: "80%",
            background: "radial-gradient(ellipse at center, rgba(0,204,255,0.07) 0%, transparent 65%)",
          }}
        />
      </AnimatePresence>

      {/* Content */}
      <div
        className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10"
        style={{ minHeight: "100svh", display: "flex", alignItems: "center", paddingTop: 60 }}
      >
        <div className="grid lg:grid-cols-2 items-center gap-8 w-full py-16 lg:py-0">

          {/* ── LEFT ────────────────────────────────────────── */}
          <div className="flex flex-col justify-center order-2 lg:order-1">

            {/* Counter */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-label"}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-3 mb-8"
              >
                <span className="w-6 h-px" style={{ background: "var(--accent)" }} />
                <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--accent)" }}>
                  {storeName.toUpperCase()} · {String(current + 1).padStart(2, "0")} / {String(Math.min(products.length, 8)).padStart(2, "0")}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Title */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-title"}
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <h1
                  style={{
                    fontSize: "clamp(52px, 8.5vw, 120px)",
                    fontWeight: 900,
                    letterSpacing: "-0.04em",
                    lineHeight: 0.88,
                    color: "#fff",
                  }}
                >
                  {line1}<br />
                  <span style={{ color: "var(--accent)" }}>{line2 || "PRO"}</span>
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* Price */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-price"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="flex items-baseline gap-3 mt-6"
              >
                <span style={{ fontSize: 28, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>
                  {formatPrice(product.price)}
                </span>
                {product.comparePrice && product.comparePrice > product.price && (
                  <span style={{ fontSize: 16, fontWeight: 400, color: "rgba(255,255,255,0.30)", textDecoration: "line-through" }}>
                    {formatPrice(product.comparePrice)}
                  </span>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Buttons */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-btns"}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="flex items-center gap-3 mt-8"
              >
                <Link href={`${base}/product/${product.slug}`} className="btn-primary">
                  Купить сейчас
                </Link>
                <Link href={`${base}/catalog`} className="btn-outline flex items-center gap-2">
                  Каталог <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </AnimatePresence>

            {/* Dots */}
            <div className="flex items-center gap-2 mt-12">
              {products.slice(0, 8).map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Слайд ${i + 1}`}
                  animate={{
                    width:      i === current ? 28 : 6,
                    background: i === current ? "#00CCFF" : "rgba(255,255,255,0.25)",
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ height: 4, borderRadius: 99, border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT — image ────────────────────────────────── */}
          <div className="flex items-center justify-center order-1 lg:order-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-img"}
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -20 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="animate-float relative"
                style={{
                  width:  "clamp(240px, 44vw, 580px)",
                  height: "clamp(240px, 44vw, 580px)",
                  filter: "drop-shadow(0 0 60px rgba(0,204,255,0.22)) drop-shadow(0 40px 80px rgba(0,0,0,0.6))",
                }}
              >
                {product.images[0] ? (
                  <Link href={`${base}/product/${product.slug}`} className="absolute block" style={{ inset: "6%" }}>
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain"
                      priority
                      sizes="(max-width: 1024px) 80vw, 45vw"
                    />
                  </Link>
                ) : (
                  <div
                    className="absolute inset-0 rounded-3xl flex items-center justify-center"
                    style={{ border: "1px solid rgba(0,204,255,0.20)" }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.15)", fontSize: 14 }}>Нет фото</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 inset-x-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
      />
    </section>
  )
}
