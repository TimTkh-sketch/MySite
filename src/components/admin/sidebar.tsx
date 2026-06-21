"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Store,
  Package,
  FolderOpen,
  ShoppingCart,
  Settings,
  LogOut,
  Image,
  ExternalLink,
  Layers,
  TrendingDown,
  Home,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { signOut } from "next-auth/react"

const navItems = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard },
  { href: "/admin/stores", label: "Магазины", icon: Store },
  { href: "/admin/products", label: "Товары", icon: Package },
  { href: "/admin/categories", label: "Категории", icon: FolderOpen },
  { href: "/admin/properties", label: "Свойства", icon: Layers },
  { href: "/admin/orders", label: "Заказы", icon: ShoppingCart },
  { href: "/admin/banners", label: "Баннеры", icon: Image },
  { href: "/admin/pricing", label: "Цены", icon: TrendingDown },
  { href: "/admin/homepage", label: "Главная", icon: Home },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
]

export function AdminSidebar({ storeSlug }: { storeSlug?: string }) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      <div className="flex h-14 items-center justify-between border-b border-gray-200 px-4">
        <div>
          <span className="text-lg font-bold text-gray-900">MyShop</span>
          <span className="ml-1 text-xs text-gray-400">Admin</span>
        </div>
        {storeSlug && (
          <Link
            href={`/store/${storeSlug}`}
            target="_blank"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            title="Открыть витрину"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Сайт
          </Link>
        )}
      </div>

      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-200 p-3 space-y-1">
        {storeSlug && (
          <Link
            href={`/store/${storeSlug}`}
            target="_blank"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
            Открыть магазин
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </button>
      </div>
    </aside>
  )
}
