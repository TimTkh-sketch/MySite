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
  const [atTop, setAtTop]           = useState(true)
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
      setAtTop(y < 10)
      setHidden(y > lastY && y > 80)
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

  const textColor = atTop ? "rgba(255,255,255,0.88)" : "#444"

  return (
    <>
      <motion.header
        className="fixed top-0 inset-x-0 z-50"
        animate={{ y: hidden && !megaOpen ? -100 : 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        style={{
          height: 52,
          background: atTop ? "transparent" : "rgba(255,255,255,0.88)",
          backdropFilter: atTop ? "none" : "saturate(200%) blur(20px)",
          WebkitBackdropFilter: atTop ? "none" : "saturate(200%) blur(20px)",
          borderBottom: atTop ? "1px solid transparent" : "1px solid rgba(0,0,0,0.07)",
          transition: "background 0.3s, border-color 0.3s",
        }}
      >
        <div className="flex items-center justify-between h-full px-6 lg:px-10 max-w-[1400px] mx-auto">

          {/* Logo */}
          <Link
            href={base}
            className="text-[15px] font-black tracking-tight shrink-0 transition-colors"
            style={{ color: atTop ? "#fff" : "#1d1d1f" }}
          >
            {store.name}<span style={{ color: "var(--accent)", fontWeight: 300 }}>°</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-7 absolute left-1/2 -translate-x-1/2">

            {/* Каталог с мега-меню */}
            <div className="relative" onMouseEnter={openMega} onMouseLeave={closeMega}>
              <button
                className="flex items-center gap-1 text-[12px] font-semibold tracking-[0.05em] uppercase transition-colors hover:opacity-70"
                style={{ color: textColor, background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}
              >
                Каталог
                <ChevronDown
                  className="h-3 w-3 transition-transform duration-200"
                  style={{ transform: megaOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
            </div>

            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[12px] font-semibold tracking-[0.05em] uppercase transition-colors hover:opacity-70"
                style={{ color: textColor }}
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
              style={{
                color: atTop ? "rgba(255,255,255,0.88)" : "#555",
                border: `1.5px solid ${atTop ? "rgba(255,255,255,0.30)" : "rgba(0,0,0,0.12)"}`,
              }}
            >
              <UserCircle className="h-3.5 w-3.5 shrink-0" />
              {isLoggedIn ? "Кабинет" : "Войти"}
            </Link>

            <Link
              href={`${base}/wishlist`}
              className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-black/5"
              style={{ color: atTop ? "rgba(255,255,255,0.80)" : "#888" }}
            >
              <Heart className="h-4 w-4" />
              {wishCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                  style={{ background: "var(--accent)" }}
                >
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
            </Link>

            <Link
              href={`${base}/checkout`}
              data-cart-button
              className="flex items-center gap-2 text-[12px] font-semibold px-4 py-2 rounded-full transition-all"
              style={{ background: "var(--accent)", color: "#fff" }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "var(--accent-hover)")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "var(--accent)")}
            >
              {count > 0 && (
                <span
                  className="w-4 h-4 rounded-full bg-white text-[10px] font-black flex items-center justify-center shrink-0"
                  style={{ color: "var(--accent)" }}
                >
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Корзина</span>
            </Link>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-black/5"
              style={{ color: atTop ? "rgba(255,255,255,0.80)" : "#555" }}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* ── MEGA MENU ─────────────────────────────────────────── */}
      <AnimatePresence>
        {megaOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-x-0 z-40"
            style={{ top: 52 }}
            onMouseEnter={openMega}
            onMouseLeave={closeMega}
          >
            <div
              className="max-w-[1400px] mx-auto mx-6 lg:mx-10 rounded-b-2xl overflow-hidden"
              style={{
                background: "rgba(255,255,255,0.95)",
                backdropFilter: "saturate(200%) blur(24px)",
                borderBottom: "1px solid rgba(0,0,0,0.07)",
                borderLeft: "1px solid rgba(0,0,0,0.07)",
                borderRight: "1px solid rgba(0,0,0,0.07)",
                boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
              }}
            >
              <div className="px-10 py-8">
                <p className="label-tag mb-5">Все разделы</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  <Link
                    href={`${base}/catalog`}
                    onClick={() => setMegaOpen(false)}
                    className="flex flex-col gap-1.5 px-4 py-3 rounded-xl transition-all hover:bg-[#f5f5f7]"
                  >
                    <span className="text-[13px] font-semibold" style={{ color: "var(--text)" }}>Все товары</span>
                    <span className="text-[11px]" style={{ color: "var(--text-3)" }}>Полный каталог</span>
                  </Link>
                  {store.categories.map(cat => (
                    <Link
                      key={cat.id}
                      href={`${base}/catalog?category=${cat.slug}`}
                      onClick={() => setMegaOpen(false)}
                      className="flex flex-col gap-1 px-4 py-3 rounded-xl transition-all hover:bg-[#f5f5f7] group"
                    >
                      <span className="text-[13px] font-medium group-hover:text-[var(--accent)] transition-colors" style={{ color: "var(--text)" }}>
                        {cat.name}
                      </span>
                    </Link>
                  ))}
                </div>
                <div className="mt-6 pt-5 border-t flex items-center gap-4" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
                  <Link
                    href={`${base}/catalog?featured=1`}
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors hover:opacity-70"
                    style={{ color: "var(--accent)" }}
                  >
                    Хиты продаж <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link
                    href={`${base}/catalog?sort=new`}
                    onClick={() => setMegaOpen(false)}
                    className="flex items-center gap-1.5 text-[12px] font-semibold transition-colors hover:opacity-70"
                    style={{ color: "var(--text-2)" }}
                  >
                    Новинки <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MOBILE MENU ───────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-30 lg:hidden"
              style={{ background: "rgba(0,0,0,0.35)", backdropFilter: "blur(4px)" }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="fixed z-40 lg:hidden rounded-2xl overflow-hidden"
              style={{
                top: 60,
                left: 16,
                right: 16,
                background: "#fff",
                boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
              }}
            >
              <div className="p-5">
                <p className="label-tag mb-4 opacity-60">{store.name} · Меню</p>
                <div className="space-y-0.5">
                  {[
                    { label: "Каталог",  href: `${base}/catalog` },
                    { label: "Хиты",     href: `${base}/catalog?featured=1` },
                    { label: "Новинки",  href: `${base}/catalog?sort=new` },
                    { label: isLoggedIn ? "Личный кабинет" : "Войти", href: isLoggedIn ? `${base}/account` : "/customer/login" },
                    { label: `Корзина${count > 0 ? ` (${count})` : ""}`, href: `${base}/checkout` },
                  ].map(({ label, href }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04, duration: 0.2 }}
                    >
                      <Link
                        href={href}
                        onClick={() => setMobileOpen(false)}
                        className="block text-[17px] font-semibold py-3 border-b last:border-0 transition-colors hover:text-[var(--accent)] active:opacity-60"
                        style={{ color: "var(--text)", borderColor: "rgba(0,0,0,0.06)" }}
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
