"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowUpRight, ChevronRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion"

interface Product {
  id: string; name: string; slug: string; price: number
  comparePrice?: number | null; images: string[]; stock: number
}

const INTERVAL = 5000

export function HeroCarousel({ products, storeSlug, storeName }: {
  products: Product[]; storeSlug: string; storeName: string
}) {
  const [current, setCurrent] = useState(0)
  const currentRef = useRef(0)
  const base = `/store/${storeSlug}`
  const heroRef = useRef<HTMLElement>(null)
  const { scrollY } = useScroll()
  const productY = useTransform(scrollY, [0, 700], [0, -80])

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
  const brandWord  = words[0].toUpperCase()
  const modelWords = words.slice(1, 3).join(" ").toUpperCase() || "PRO"
  const nextProduct = products[(current + 1) % products.length]

  return (
    <section
      ref={heroRef}
      className="relative overflow-hidden bg-white"
      style={{ minHeight: "calc(100vh - 56px)" }}
    >
      {/* ── TOP META BAR ─────────────────────────────────────── */}
      <div className="absolute top-5 sm:top-7 left-6 sm:left-12 z-20 flex items-center gap-3">
        <span className="label-tag">{storeName}</span>
        <span className="w-1 h-1 rounded-full bg-[#F26522] opacity-60" />
        <span className="label-tag opacity-40">
          {String(current + 1).padStart(2, "0")} / {String(Math.min(products.length, 8)).padStart(2, "0")}
        </span>
      </div>

      {/* ── NEXT PRODUCT HINT ────────────────────────────────── */}
      {products.length > 1 && (
        <button
          onClick={() => goTo((current + 1) % products.length)}
          className="absolute top-5 sm:top-7 right-6 sm:right-12 z-20 hidden sm:flex flex-col items-end gap-0.5 group"
        >
          <span className="label-tag opacity-40 group-hover:opacity-60 transition-opacity">СЛЕДУЮЩИЙ</span>
          <span className="text-xs font-semibold text-[#666] group-hover:text-[#F26522] transition-colors flex items-center gap-1">
            {nextProduct?.name.split(" ").slice(0, 3).join(" ")}
            <ChevronRight className="h-3 w-3" />
          </span>
        </button>
      )}

      {/* ── EDITORIAL BACKGROUND NUMBER ──────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current + "num"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="editorial-num absolute pointer-events-none select-none z-0"
          style={{ right: "-4%", top: "50%", transform: "translateY(-50%)" }}
        >
          {String(current + 1).padStart(2, "0")}
        </motion.div>
      </AnimatePresence>

      {/* ── SPLIT GRID ───────────────────────────────────────── */}
      <div
        className="grid lg:grid-cols-2 items-center"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >

        {/* ── LEFT: Text + Price + Controls ──────────────────── */}
        <div className="flex flex-col justify-between px-6 sm:px-12 pt-8 pb-8 sm:pb-10 relative z-10 order-2 lg:order-1 lg:h-full lg:py-10">

          {/* Spacer for meta bar on desktop */}
          <div className="hidden lg:block h-14" />

          {/* Title — grows to push price to bottom on desktop */}
          <div className="flex-1 flex items-end pb-8 lg:pb-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id + "title"}
                initial={{ opacity: 0, y: 48 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -24 }}
                transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <h1
                  className="font-bold text-[#0a0a0a] leading-[0.9] tracking-[-0.04em]"
                  style={{ fontSize: "clamp(48px, 7.5vw, 120px)" }}
                >
                  {brandWord}
                  <br />
                  <span style={{ color: "#F26522" }}>{modelWords}</span>
                </h1>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Price */}
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id + "price"}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
            >
              <p className="label-tag mb-1.5 opacity-50">ЦЕНА</p>
              <p
                className="font-black text-[#0a0a0a] leading-none tracking-tight"
                style={{ fontSize: "clamp(22px, 3.5vw, 36px)" }}
              >
                {formatPrice(product.price)}
              </p>
              {product.comparePrice && product.comparePrice > product.price && (
                <p className="text-sm text-[#bbb] line-through mt-0.5">
                  {formatPrice(product.comparePrice)}
                </p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT: Product image + Controls ────────────────── */}
        <div className="flex flex-col items-center justify-center relative z-10 order-1 lg:order-2 pt-20 pb-8 lg:py-10 gap-6">
          <motion.div style={{ y: productY }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, scale: 0.88, y: 40 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -24 }}
                transition={{ duration: 0.65, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="hero-product relative"
                style={{
                  width:  "clamp(220px, 42vw, 540px)",
                  height: "clamp(220px, 42vw, 540px)",
                }}
              >
                {/* Ambient glow */}
                <div
                  className="absolute inset-0 rounded-full blur-3xl pointer-events-none"
                  style={{ background: "rgba(242,101,34,0.07)", transform: "scale(0.75) translateY(8%)" }}
                />
                {product.images[0] ? (
                  <Link
                    href={`${base}/product/${product.slug}`}
                    className="absolute block"
                    style={{ inset: "8%" }}
                  >
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-contain drop-shadow-2xl"
                      priority
                      sizes="(max-width: 1024px) 80vw, 45vw"
                    />
                  </Link>
                ) : (
                  <div className="absolute inset-0 rounded-3xl bg-[#f5f5f5] flex items-center justify-center">
                    <span className="text-[#bbb] text-sm">Нет фото</span>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Dots + CTA — under the product, right-aligned */}
          <div className="flex flex-col items-center lg:items-end gap-4 w-full lg:pr-4">
            <div className="flex items-center gap-2">
              {products.slice(0, 8).map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-300 ${
                    i === current
                      ? "w-6 h-[5px] bg-[#0a0a0a]"
                      : "w-[5px] h-[5px] bg-[#0a0a0a]/15 hover:bg-[#0a0a0a]/35"
                  }`}
                />
              ))}
            </div>
            <Link
              href={`${base}/product/${product.slug}`}
              className="btn-primary flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold shrink-0"
            >
              Смотреть товар
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </section>
  )
}
