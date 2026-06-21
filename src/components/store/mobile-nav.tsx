"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Grid3X3, ShoppingCart, Search } from "lucide-react"
import { useCart } from "./cart-provider"

interface Tab {
  label: string
  Icon: React.ComponentType<{ className?: string }>
  href?: string
  action?: () => void
  badge?: number | null
}

export function MobileNav({ storeSlug, onSearchOpen }: { storeSlug: string; onSearchOpen: () => void }) {
  const { count } = useCart()
  const pathname = usePathname()
  const base = `/store/${storeSlug}`

  const tabs: Tab[] = [
    { label: "Главная", href: base, Icon: Home },
    { label: "Каталог", href: `${base}/catalog`, Icon: Grid3X3 },
    { label: "Поиск",   Icon: Search, action: onSearchOpen },
    { label: "Корзина", href: `${base}/checkout`, Icon: ShoppingCart, badge: count > 0 ? count : null },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-3 pb-3">
      <div
        className="glass-bright overflow-hidden"
        style={{ borderRadius: 20, boxShadow: "0 -4px 24px rgba(0,0,0,0.08)" }}
      >
        <div className="flex items-center">
          {tabs.map(({ label, href, Icon, badge, action }) => {
            const active = href ? pathname === href || (href !== base && pathname.startsWith(href)) : false
            const inner = (
              <div className={`flex flex-col items-center gap-1 py-3 px-1 relative transition-colors duration-150 ${active ? "text-[#F26522]" : "text-[#999]"}`}>
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-[#F26522] text-white text-[10px] font-black rounded-full flex items-center justify-center px-0.5 animate-scale-in">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold leading-none">{label}</span>
                {active && (
                  <div className="absolute -top-[1px] left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#F26522] rounded-full" />
                )}
              </div>
            )
            return action ? (
              <button key={label} onClick={action} className="flex-1 active:scale-95 transition-transform">{inner}</button>
            ) : (
              <Link key={label} href={href!} className="flex-1 active:scale-95 transition-transform">{inner}</Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
