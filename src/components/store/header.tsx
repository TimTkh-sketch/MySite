"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  ShoppingCart,
  Phone,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Settings,
  MapPin,
  Clock,
} from "lucide-react"
import { useCart } from "./cart-provider"
import { useSession } from "next-auth/react"

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
}

interface Store {
  name: string
  slug: string
  logo?: string | null
  settings?: {
    phone?: string | null
    workingHours?: string | null
    address?: string | null
  } | null
  categories: Category[]
}

export function StoreHeader({ store }: { store: Store }) {
  const { count } = useCart()
  const { data: session } = useSession()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const base = `/store/${store.slug}`
  const isAdmin =
    session?.user?.role === "SUPER_ADMIN" ||
    session?.user?.role === "STORE_OWNER" ||
    session?.user?.role === "STORE_MANAGER"

  return (
    <>
      <header className="sticky top-0 z-40 bg-white">
        {/* ── Top info bar ── */}
        <div className="hidden sm:block bg-[#1a1a1a] text-xs text-gray-300">
          <div className="max-w-7xl mx-auto px-4 h-8 flex items-center justify-between">
            <div className="flex items-center gap-5">
              {store.settings?.address && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3 w-3 shrink-0" />
                  {store.settings.address}
                </span>
              )}
              {store.settings?.workingHours && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3 w-3 shrink-0" />
                  {store.settings.workingHours}
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Settings className="h-3 w-3" />
                  Администрирование
                </Link>
              )}
              {store.settings?.phone && (
                <a
                  href={`tel:${store.settings.phone}`}
                  className="flex items-center gap-1.5 font-semibold text-white hover:text-gray-200 transition-colors"
                >
                  <Phone className="h-3 w-3" />
                  {store.settings.phone}
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── Logo + cart row ── */}
        <div className="border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center justify-between gap-4">
            <Link href={base} className="shrink-0 flex items-center">
              {store.logo ? (
                <Image
                  src={store.logo}
                  alt={store.name}
                  width={160}
                  height={44}
                  className="h-10 w-auto object-contain"
                  priority
                />
              ) : (
                <span className="text-xl font-bold text-gray-900">{store.name}</span>
              )}
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Mobile admin */}
              {isAdmin && (
                <Link
                  href="/admin"
                  className="sm:hidden p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
                  aria-label="Админка"
                >
                  <Settings className="h-4 w-4" />
                </Link>
              )}

              {/* Phone mobile */}
              {store.settings?.phone && (
                <a
                  href={`tel:${store.settings.phone}`}
                  className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-[#FF6B35] transition-colors"
                >
                  <Phone className="h-4 w-4 text-[#FF6B35]" />
                  {store.settings.phone}
                </a>
              )}

              {/* Cart button */}
              <Link
                href={`${base}/checkout`}
                className="flex items-center gap-2 bg-[#FF6B35] hover:bg-[#e55a25] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                <ShoppingCart className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Корзина</span>
                {count > 0 && (
                  <span className="inline-flex items-center justify-center bg-white text-[#FF6B35] text-xs font-bold min-w-[20px] h-5 px-1 rounded-full">
                    {count}
                  </span>
                )}
              </Link>

              {/* Hamburger */}
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                onClick={() => setDrawerOpen(true)}
                aria-label="Меню"
              >
                <Menu className="h-5 w-5 text-gray-700" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Desktop category nav ── */}
        <nav className="hidden lg:block border-b border-gray-100 bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center overflow-x-auto scrollbar-hide gap-0">
              {store.categories.map((cat) => (
                <div key={cat.id} className="relative group shrink-0">
                  <Link
                    href={`${base}/catalog?category=${cat.slug}`}
                    className="flex items-center gap-1 px-3 py-3.5 text-sm font-medium text-gray-700 hover:text-[#FF6B35] whitespace-nowrap transition-colors border-b-2 border-transparent hover:border-[#FF6B35] group-hover:text-[#FF6B35] group-hover:border-[#FF6B35]"
                  >
                    {cat.name}
                    {cat.children.length > 0 && (
                      <ChevronDown className="h-3 w-3 opacity-60 transition-transform group-hover:rotate-180" />
                    )}
                  </Link>
                  {cat.children.length > 0 && (
                    <div className="absolute left-0 top-full z-50 hidden group-hover:block">
                      <div className="mt-0 pt-1">
                        <div className="bg-white border border-gray-200 rounded-xl shadow-2xl min-w-[220px] py-2 overflow-hidden">
                          <div className="px-4 py-1.5 mb-1 border-b border-gray-100">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              {cat.name}
                            </span>
                          </div>
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={`${base}/catalog?category=${child.slug}`}
                              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                            >
                              <ChevronRight className="h-3 w-3 text-gray-300 shrink-0" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative w-[300px] max-w-[90vw] bg-white h-full flex flex-col shadow-2xl overflow-hidden">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <Link href={base} onClick={() => setDrawerOpen(false)} className="flex items-center">
                {store.logo ? (
                  <Image
                    src={store.logo}
                    alt={store.name}
                    width={120}
                    height={36}
                    className="h-8 w-auto object-contain"
                  />
                ) : (
                  <span className="font-bold text-gray-900">{store.name}</span>
                )}
              </Link>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            {/* Contact block */}
            {(store.settings?.phone || store.settings?.address) && (
              <div className="px-4 py-3 bg-orange-50 border-b border-orange-100">
                {store.settings?.phone && (
                  <a
                    href={`tel:${store.settings.phone}`}
                    className="flex items-center gap-2 text-sm font-semibold text-[#FF6B35] mb-1"
                  >
                    <Phone className="h-4 w-4" />
                    {store.settings.phone}
                  </a>
                )}
                {store.settings?.workingHours && (
                  <p className="flex items-center gap-2 text-xs text-orange-700">
                    <Clock className="h-3.5 w-3.5" />
                    {store.settings.workingHours}
                  </p>
                )}
              </div>
            )}

            {/* Categories list */}
            <nav className="flex-1 overflow-y-auto py-1">
              {store.categories.map((cat) => (
                <div key={cat.id} className="border-b border-gray-50 last:border-0">
                  <div className="flex items-stretch">
                    <Link
                      href={`${base}/catalog?category=${cat.slug}`}
                      className="flex-1 px-4 py-3 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-[#FF6B35] transition-colors"
                      onClick={() => {
                        if (cat.children.length === 0) setDrawerOpen(false)
                      }}
                    >
                      {cat.name}
                    </Link>
                    {cat.children.length > 0 && (
                      <button
                        onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                        className="px-3 hover:bg-gray-100 transition-colors border-l border-gray-100"
                        aria-label="Подкатегории"
                      >
                        <ChevronDown
                          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${openCat === cat.id ? "rotate-180" : ""}`}
                        />
                      </button>
                    )}
                  </div>
                  {openCat === cat.id && (
                    <div className="bg-gray-50 border-l-[3px] border-[#FF6B35] ml-4">
                      {cat.children.map((child) => (
                        <Link
                          key={child.id}
                          href={`${base}/catalog?category=${child.slug}`}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-600 hover:text-[#FF6B35] hover:bg-orange-50 transition-colors"
                          onClick={() => setDrawerOpen(false)}
                        >
                          <span className="w-1 h-1 rounded-full bg-gray-400 shrink-0" />
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {isAdmin && (
              <div className="p-4 border-t border-gray-100 bg-gray-50">
                <Link
                  href="/admin"
                  className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  onClick={() => setDrawerOpen(false)}
                >
                  <Settings className="h-4 w-4" />
                  Панель управления
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
