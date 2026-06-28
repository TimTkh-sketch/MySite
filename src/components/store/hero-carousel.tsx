"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
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
  const currentRef            = useRef(0)
  const base                  = `/store/${storeSlug}`

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

  const words      = product.name.split(" ")
  const brandWord  = words[0].toUpperCase()
  const modelWords = words.slice(1, 3).join(" ").toUpperCase() || "PRO"

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: "100svh", background: "#000", paddingTop: 52 }}
    >
      {/* Slide background gradient — меняется при переходе */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current + "-bg"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 65% 80% at 68% 55%, #0a1f40 0%, #000 70%)",
          }}
        />
      </AnimatePresence>

      {/* Subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* Content */}
      <div
        className="relative z-10 max-w-[1400px] mx-auto px-6 lg:px-10"
        style={{ minHeight: "calc(100svh - 52px)", display: "flex", alignItems: "center" }}
      >
        <div className="grid lg:grid-cols-2 items-center gap-8 w-full" style={{ minHeight: "calc(100svh - 52px)" }}>

          {/* ── LEFT — текст ──────────────────────────────────── */}
          <div className="flex flex-col justify-center py-20 lg:py-0 order-2 lg:order-1">

            {/* Лейбл */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-label"}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="flex items-center gap-2 mb-6"
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: "var(--accent-on-dark)" }}
                />
                <span
                  className="text-[11px] font-semibold tracking-[0.10em] uppercase"
                  style={{ color: "var(--accent-on-dark)" }}
                >
                  {storeName} · {String(current + 1).padStart(2,"0")} / {String(Math.min(products.length,8)).padStart(2,"0")}
                </span>
              </motion.div>
            </AnimatePresence>

            {/* Заголовок */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-title"}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <h1
                  className="font-black leading-[0.92] tracking-[-0.03em]"
                  style={{ fontSize: "clamp(52px, 7.5vw, 108px)", color: "#fff" }}
                >
                  {brandWord}
                  <br />
                  <span style={{ color: "var(--accent-on-dark)" }}>{modelWords}</span>
                </h1>
              </motion.div>
            </AnimatePresence>

            {/* Цена */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-price"}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
                style={{ marginTop: 24 }}
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="font-bold"
                    style={{ fontSize: 30, color: "#fff" }}
                  >
                    {formatPrice(product.price)}
                  </span>
                  {product.comparePrice && product.comparePrice > product.price && (
                    <span
                      className="text-[18px] line-through"
                      style={{ color: "rgba(255,255,255,0.35)" }}
                    >
                      {formatPrice(product.comparePrice)}
                    </span>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Кнопки */}
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-btns"}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="flex items-center gap-3"
                style={{ marginTop: 32 }}
              >
                <Link
                  href={`${base}/product/${product.slug}`}
                  className="btn-primary"
                  style={{ fontSize: 15, height: 48 }}
                >
                  Купить сейчас
                </Link>
                <Link
                  href={`${base}/catalog`}
                  className="flex items-center gap-2 px-6 rounded-full font-medium text-[15px] text-white transition-all"
                  style={{
                    height: 48,
                    border: "1.5px solid rgba(255,255,255,0.30)",
                    background: "transparent",
                  }}
                  onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)")}
                  onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "transparent")}
                >
                  Каталог
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
                    width:   i === current ? 24 : 6,
                    opacity: i === current ? 1 : 0.3,
                  }}
                  transition={{ duration: 0.3 }}
                  className="rounded-full transition-colors"
                  style={{
                    height: 6,
                    background: "#fff",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    flexShrink: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── RIGHT — изображение ────────────────────────────── */}
          <div className="flex items-center justify-center order-1 lg:order-2 pt-12 lg:pt-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "-img"}
                initial={{ opacity: 0, scale: 0.88, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -20 }}
                transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="animate-hero-float relative"
                style={{
                  width:  "clamp(220px, 42vw, 580px)",
                  height: "clamp(220px, 42vw, 580px)",
                  filter: "drop-shadow(0 40px 80px rgba(0, 100, 255, 0.18))",
                }}
              >
                {product.images[0] ? (
                  <Link
                    href={`${base}/product/${product.slug}`}
                    className="absolute block"
                    style={{ inset: "6%" }}
                  >
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
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 14 }}>Нет фото</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

        </div>
      </div>
    </section>
  )
}
