"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ShoppingCart, Menu, X, Heart, Send, UserCircle } from "lucide-react"
import { useCart } from "./cart-provider"
import { useWishlist } from "./wishlist-provider"
import { LanguageSwitcher } from "./language-switcher"

interface Store {
  name: string; slug: string
  settings?: { phone?: string | null; socialVk?: string | null; socialTg?: string | null } | null
  categories: { id: string; name: string; slug: string }[]
}

export function StoreHeader({ store }: { store: Store }) {
  const [hidden, setHidden]     = useState(false)
  const [atTop, setAtTop]       = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { count } = useCart()
  const { count: wishCount } = useWishlist()
  const pathname = usePathname()
  const base = `/store/${store.slug}`
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

  const navLinks = [
    { label: "Каталог", href: `${base}/catalog` },
    { label: "Хиты",    href: `${base}/catalog?featured=1` },
    { label: "Новинки", href: `${base}/catalog?sort=new` },
  ]

  return (
    <>
      <header
        className="fixed top-0 inset-x-0 z-50"
        style={{
          background: atTop ? "rgba(255,255,255,0)" : "rgba(255,255,255,0.88)",
          backdropFilter: atTop ? "none" : "blur(20px) saturate(180%)",
          WebkitBackdropFilter: atTop ? "none" : "blur(20px) saturate(180%)",
          borderBottom: atTop ? "1px solid transparent" : "1px solid rgba(0,0,0,0.06)",
          transform: hidden ? "translateY(-100%)" : "translateY(0)",
          transition: "transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94), background 0.3s ease, border-color 0.3s ease, backdrop-filter 0.3s ease",
        }}
      >
        <div className="flex items-center justify-between h-14 sm:h-16 px-6 sm:px-10 max-w-7xl mx-auto">
          {/* Logo */}
          <Link
            href={base}
            className="font-black text-[15px] tracking-tight shrink-0 transition-colors"
            style={{ color: "#0a0a0a" }}
          >
            {store.name}<span style={{ color: "#F26522", fontWeight: 300 }}>°</span>
          </Link>

          {/* Desktop nav — absolute center */}
          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map(({ label, href }) => (
              <Link
                key={label}
                href={href}
                className="text-[11px] font-bold tracking-[0.12em] uppercase transition-colors duration-200"
                style={{ color: "#444", letterSpacing: "0.12em" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#0a0a0a")}
                onMouseLeave={e => (e.currentTarget.style.color = "#444")}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Social links */}
            {store.settings?.socialVk && (
              <a
                href={store.settings.socialVk}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-[#f5f5f5]"
                title="ВКонтакте"
              >
                <span className="text-[10px] font-black text-[#bbb] hover:text-[#0a0a0a] leading-none" style={{ letterSpacing: "0.02em" }}>ВК</span>
              </a>
            )}
            {store.settings?.socialTg && (
              <a
                href={store.settings.socialTg}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center justify-center w-7 h-7 rounded-full transition-colors hover:bg-[#f5f5f5]"
                title="Telegram"
              >
                <Send className="h-3.5 w-3.5 text-[#bbb]" />
              </a>
            )}
            <LanguageSwitcher />
            <Link
              href={isLoggedIn ? `${base}/account` : "/customer/login"}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all active:scale-95 border"
              style={{
                background: isLoggedIn ? "#fff3ee" : "transparent",
                color: isLoggedIn ? "#F26522" : "#555",
                borderColor: isLoggedIn ? "#F26522" : "#ddd",
              }}
            >
              <UserCircle className="h-3.5 w-3.5 shrink-0" />
              {isLoggedIn ? "Кабинет" : "Войти"}
            </Link>
            <Link
              href={`${base}/wishlist`}
              className="relative hidden sm:flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-[#f5f5f5]"
              title="Избранное"
            >
              <Heart className="h-4 w-4 text-[#888]" />
              {wishCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#F26522] text-white text-[9px] font-black flex items-center justify-center">
                  {wishCount > 9 ? "9+" : wishCount}
                </span>
              )}
            </Link>
            <Link
              href={`${base}/checkout`}
              data-cart-button
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold transition-all active:scale-95"
              style={{
                background: "#0a0a0a",
                color: "#ffffff",
                borderRadius: 100,
              }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = "#F26522")}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = "#0a0a0a")}
            >
              {count > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#F26522] text-white text-[10px] font-black flex items-center justify-center shrink-0">
                  {count > 9 ? "9+" : count}
                </span>
              )}
              <ShoppingCart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Корзина</span>
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors active:scale-90"
              style={{ color: "#666" }}
            >
              {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden pt-16">
          <div
            className="absolute inset-0"
            style={{ background: "rgba(0,0,0,0.15)", backdropFilter: "blur(4px)" }}
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative mx-4 mt-2 rounded-3xl p-6 animate-slide-up"
            style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 20px 60px rgba(0,0,0,0.10)" }}
          >
            <p className="label-tag mb-5 opacity-60">{store.name} · Навигация</p>
            <div className="space-y-0.5">
              {[
                ...navLinks,
                { label: isLoggedIn ? "Личный кабинет" : "Войти / Регистрация", href: isLoggedIn ? `${base}/account` : "/customer/login" },
                { label: `Корзина${count > 0 ? ` (${count})` : ""}`, href: `${base}/checkout` },
              ].map(({ label, href }) => (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="block text-lg font-bold text-[#1a1a1a] hover:text-[#F26522] py-3 border-b border-[#f0f0f0] last:border-0 transition-colors active:opacity-60"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
