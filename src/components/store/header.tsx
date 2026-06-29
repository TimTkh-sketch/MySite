"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Menu, X, Heart, UserCircle, ChevronDown, ArrowUpRight } from "lucide-react"
import { useCart } from "./cart-provider"
import { useWishlist } from "./wishlist-provider"
import { LanguageSwitcher } from "./language-switcher"
import { motion, AnimatePresence } from "framer-motion"

interface Store {
  name: string; slug: string
  settings?: { phone?: string | null; socialVk?: string | null; socialTg?: string | null } | null
  categories: { id: string; name: string; slug: string }[]
}

export function StoreHeader({ store }: { store: Store }) {
  const [hidden, setHidden]         = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen]     = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const megaTimer                   = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { count }                   = useCart()
  const { count: wishCount }        = useWishlist()
  const pathname                    = usePathname()
  const base                        = `/store/${store.slug}`

  useEffect(() => {
    fetch("/api/customer/me").then(r => setIsLoggedIn(r.ok)).catch(() => setIsLoggedIn(false))
  }, [pathname])

  useEffect(() => {
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      setHidden(y > lastY && y > 100)
      lastY = y
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => { setMobileOpen(false) }, [pathname])

  function openMega() {
    if (megaTimer.current) clearTimeout(megaTimer.current)
    setMegaOpen(true)
  }
  function closeMega() {
    megaTimer.current = setTimeout(() => setMegaOpen(false), 180)
  }

  const navLinks = [
    { label: "Хиты",    href: `${base}/catalog?featured=1` },
    { label: "Новинки", href: `${base}/catalog?sort=new` },
  ]

  return (
    <>
      <motion.header
        className="fixed top-0 inset-x-0 z-50"
        animate={{ y: hidden && !megaOpen ? -100 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: 60,
          background: "rgba(0,0,0,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center justify-between h-full px-6 lg:px-10 max-w-[1400px] mx-auto">

          {/* Logo */}
          <Link href={base} className="shrink-0" style={{ fontSize: 16, fontWeight: 900, letterSpacing: "-0.02em", color: "#fff", textDecoration: "none" }}>
            {store.name}<span style={{ color: "var(--accent)", fontWeight: 300 }}>°</span>
          </Link>

          {/* Nav */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            <div className="relative" onMouseEnter={openMega} onMouseLeave={closeMega}>
              <button
                className="flex items-center gap-1.5 transition-colors"
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
              >
                Каталог
                <ChevronDown
                  className="h-3 w-3"
                  style={{ transform: megaOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                />
              </button>
            </div>
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(255,255,255,0.65)", textDecoration: "none" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageSwitcher />

            <Link
              href={isLoggedIn ? `${base}/account` : "/customer/login"}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={{ color: "rgba(255,255,255,0.55)", border: "1px solid rgba(255,255,255,0.12)" }}
            >
              <UserCircle className="h-3.5 w-3.5 shrink-0" />
              {isLoggedIn ? "Кабинет" : "Войти"}
            </Link>

            <Link
              href={`${base}/wishlist`}
              className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-colors"
              style={{ color: "rgba(255,255,255,0.50)" }}
            >
              <Heart className="h-4 w-4" />
              {wishCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center"
                  style={{ background: "var(--accent)", color: "#000" }}
                >
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
            </Link>

            <Link
              href={`${base}/checkout`}
              className="flex items-center gap-2 text-[12px] font-bold px-4 py-2 rounded-full transition-all"
              style={{ background: "#fff", color: "#000", letterSpacing: "-0.01em" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.88)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#fff")}
            >
              {count > 0 && (
                <span
                  className="w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center shrink-0"
                  style={{ background: "var(--accent)", color: "#000" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Корзина</span>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors"
              style={{ color: "rgba(255,255,255,0.70)", background: "none", border: "none", cursor: "pointer" }}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mega menu */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 z-40"
            style={{ top: 60 }}
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <div
              className="max-w-[1400px] mx-auto mx-6 lg:mx-10 rounded-b-2xl overflow-hidden"
              style={{
                background: "rgba(14,14,14,0.97)",
                backdropFilter: "blur(24px)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderTop: "none",
                boxShadow: "0 24px 60px rgba(0,0,0,0.7)",
              }}
            >
              <div className="px-10 py-8">
                <p className="label-tag mb-5">Все разделы</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-1">
                  <Link
                    href={`${base}/catalog`}
                    onClick={() => setMegaOpen(false)}
                    className="flex flex-col gap-1.5 px-4 py-3 rounded-xl transition-all"
                    style={{ color: "#fff" }}
                    onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)")}
                    onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "")}
                  >
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Все товары</span>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Полный каталог</span>
                  </Link>
                  {store.categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`${base}/catalog?category=${cat.slug}`}
                      onClick={() => setMegaOpen(false)}
                      className="flex flex-col gap-1 px-4 py-3 rounded-xl transition-all"
                      style={{ color: "rgba(255,255,255,0.70)", fontSize: 13, fontWeight: 500 }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.color = "#fff" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.70)" }}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
                <div className="mt-6 pt-5 flex items-center gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                  <Link href={`${base}/catalog?featured=1`} onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "var(--accent)" }}>
                    Хиты продаж <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link href={`${base}/catalog?sort=new`} onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: "rgba(255,255,255,0.40)" }}>
                    Новинки <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed z-40 lg:hidden rounded-2xl overflow-hidden"
              style={{ top: 68, left: 16, right: 16, background: "#111", border: "1px solid rgba(255,255,255,0.10)", boxShadow: "0 24px 60px rgba(0,0,0,0.8)" }}
            >
              <div className="p-5">
                <p className="label-tag mb-4" style={{ opacity: 0.5 }}>{store.name} · Меню</p>
                <div className="space-y-0.5">
                  {[
                    { label: "Каталог",  href: `${base}/catalog` },
                    { label: "Хиты",     href: `${base}/catalog?featured=1` },
                    { label: "Новинки",  href: `${base}/catalog?sort=new` },
                    { label: isLoggedIn ? "Личный кабинет" : "Войти", href: isLoggedIn ? `${base}/account` : "/customer/login" },
                    { label: `Корзина${count > 0 ? ` (${count})` : ""}`, href: `${base}/checkout` },
                  ].map(({ label, href }, i) => (
                    <motion.div key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <Link
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-[17px] font-semibold py-3"
                        style={{ color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                      >
                        {label}
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
