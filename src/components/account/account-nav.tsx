"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { User, Star, ShoppingBag, Bell, LogOut, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { path: "",               label: "Мой кабинет",  icon: User },
  { path: "/profile",       label: "Профиль",      icon: User },
  { path: "/bonus",         label: "Бонусы",       icon: Star },
  { path: "/orders",        label: "Заказы",       icon: ShoppingBag },
  { path: "/notifications", label: "Уведомления",  icon: Bell },
]

export function AccountNav({
  base = "/account",
  logoutRedirect = "/customer/login",
  unreadCount = 0,
}: {
  base?: string
  logoutRedirect?: string
  unreadCount?: number
}) {
  const pathname = usePathname()
  const router   = useRouter()

  async function logout() {
    await fetch("/api/customer/logout", { method: "POST" })
    router.push(logoutRedirect)
    router.refresh()
  }

  const NAV = NAV_ITEMS.map(item => ({ ...item, href: `${base}${item.path}` }))

  return (
    <nav className="space-y-0.5">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== base && pathname.startsWith(href))
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              active
                ? "bg-[#F26522] text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
              {label === "Уведомления" && unreadCount > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-[#F26522] text-white text-[10px] font-black flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            {active && <ChevronRight className="h-4 w-4 opacity-70" />}
          </Link>
        )
      })}

      <div className="pt-2 border-t border-gray-100 mt-2">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </nav>
  )
}
