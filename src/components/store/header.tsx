"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ShoppingCart, Phone, Menu, X, ChevronDown } from "lucide-react"
import { useCart } from "./cart-provider"

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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const base = `/store/${store.slug}`

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="bg-gray-900 text-white text-xs py-1.5">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span>{store.settings?.address}</span>
          <div className="flex items-center gap-4">
            {store.settings?.workingHours && <span>{store.settings.workingHours}</span>}
            {store.settings?.phone && (
              <a href={`tel:${store.settings.phone}`} className="flex items-center gap-1 font-medium hover:text-gray-300">
                <Phone className="h-3 w-3" />
                {store.settings.phone}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href={base} className="flex items-center gap-2 font-bold text-xl text-gray-900">
          {store.logo ? (
            <Image src={store.logo} alt={store.name} width={120} height={40} className="h-10 w-auto object-contain" />
          ) : (
            store.name
          )}
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {store.categories.map((cat) => (
            <div key={cat.id} className="relative group">
              <Link
                href={`${base}/catalog?category=${cat.slug}`}
                className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-md hover:bg-gray-50"
              >
                {cat.name}
                {cat.children.length > 0 && <ChevronDown className="h-3.5 w-3.5" />}
              </Link>
              {cat.children.length > 0 && (
                <div className="absolute left-0 top-full hidden group-hover:block pt-1">
                  <div className="bg-white border border-gray-200 rounded-lg shadow-lg min-w-[180px] py-1">
                    {cat.children.map((child) => (
                      <Link
                        key={child.id}
                        href={`${base}/catalog?category=${child.slug}`}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {child.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={`${base}/checkout`}
            className="relative flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Корзина</span>
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>

          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 py-3">
          {store.categories.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                className="flex items-center justify-between w-full py-2 text-sm font-medium text-gray-700"
              >
                {cat.name}
                {cat.children.length > 0 && <ChevronDown className={`h-4 w-4 transition-transform ${openCat === cat.id ? "rotate-180" : ""}`} />}
              </button>
              {openCat === cat.id && cat.children.length > 0 && (
                <div className="pl-4 pb-2 space-y-1">
                  {cat.children.map((child) => (
                    <Link
                      key={child.id}
                      href={`${base}/catalog?category=${child.slug}`}
                      className="block py-1.5 text-sm text-gray-600"
                      onClick={() => setMobileOpen(false)}
                    >
                      {child.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </header>
  )
}
