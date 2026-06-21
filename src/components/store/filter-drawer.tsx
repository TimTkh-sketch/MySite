"use client"

import { useState } from "react"
import Link from "next/link"
import { SlidersHorizontal, X, ChevronDown } from "lucide-react"

interface Category {
  id: string
  name: string
  slug: string
  children: { id: string; name: string; slug: string }[]
  _count: { products: number }
}

interface Props {
  categories: Category[]
  storeSlug: string
  selectedSlug?: string
  sortValue?: string
}

const SORT_OPTIONS = [
  { value: "", label: "По умолчанию" },
  { value: "new", label: "Сначала новые" },
  { value: "price_asc", label: "Цена: по возрастанию" },
  { value: "price_desc", label: "Цена: по убыванию" },
  { value: "popular", label: "Сначала популярные" },
] as const

export function FilterDrawer({ categories, storeSlug, selectedSlug, sortValue = "" }: Props) {
  const [open, setOpen] = useState(false)
  const [openCat, setOpenCat] = useState<string | null>(null)
  const base = `/store/${storeSlug}/catalog`

  const activeCount = [selectedSlug, sortValue].filter(Boolean).length

  function buildHref(catSlug?: string, sort?: string) {
    const params = new URLSearchParams()
    if (catSlug) params.set("category", catSlug)
    if (sort) params.set("sort", sort)
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn-glass flex items-center gap-2 px-4 py-2 text-sm font-semibold relative active:scale-95 transition-all duration-150"
        style={{ borderRadius: 100 }}
      >
        <SlidersHorizontal className="h-4 w-4" />
        <span>Фильтры</span>
        {activeCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[10px] font-black rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-[150] lg:hidden flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div
            className="relative glass-bright rounded-t-3xl shadow-2xl animate-drawer-in max-h-[85vh] flex flex-col"
            style={{ borderBottom: "none", borderRadius: "24px 24px 0 0" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#d0d0d0]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#e8e8e8] shrink-0">
              <p className="font-black text-[#1a1a1a] text-base">Фильтры и сортировка</p>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-full hover:bg-[#f5f5f5] active:scale-90 transition-all">
                <X className="h-4 w-4 text-[#999]" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-6">
              {/* Sort */}
              <div>
                <p className="label-tag mb-3 text-[#999]">СОРТИРОВКА</p>
                <div className="space-y-1">
                  {SORT_OPTIONS.map(({ value, label }) => {
                    const active = (value === "" && !sortValue) || value === sortValue
                    return (
                      <Link
                        key={value}
                        href={buildHref(selectedSlug, value)}
                        onClick={() => setOpen(false)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-150 ${
                          active
                            ? "bg-[#fff3ee] text-[#F26522] font-bold border border-[#F26522]/20"
                            : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                        }`}
                      >
                        {label}
                        {active && <div className="w-2 h-2 rounded-full bg-[#F26522]" />}
                      </Link>
                    )
                  })}
                </div>
              </div>

              {/* Categories */}
              <div>
                <p className="label-tag mb-3 text-[#999]">КАТЕГОРИЯ</p>
                <div className="space-y-1">
                  <Link
                    href={buildHref(undefined, sortValue || undefined)}
                    onClick={() => setOpen(false)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all ${
                      !selectedSlug
                        ? "bg-[#fff3ee] text-[#F26522] font-bold border border-[#F26522]/20"
                        : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                    }`}
                  >
                    Все товары
                    {!selectedSlug && <div className="w-2 h-2 rounded-full bg-[#F26522]" />}
                  </Link>
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-stretch">
                        <Link
                          href={buildHref(cat.slug, sortValue || undefined)}
                          onClick={() => { if (cat.children.length === 0) setOpen(false) }}
                          className={`flex-1 flex items-center justify-between px-4 py-3 rounded-l-xl text-sm transition-all ${
                            selectedSlug === cat.slug
                              ? "bg-[#fff3ee] text-[#F26522] font-bold"
                              : "text-[#666] hover:bg-[#f5f5f5] hover:text-[#1a1a1a]"
                          }`}
                        >
                          <span>{cat.name}</span>
                          <span className="text-xs text-[#bbb] ml-2">{cat._count.products}</span>
                        </Link>
                        {cat.children.length > 0 && (
                          <button
                            onClick={() => setOpenCat(openCat === cat.id ? null : cat.id)}
                            className="px-3 rounded-r-xl hover:bg-[#f5f5f5] transition-colors border-l border-[#e8e8e8]"
                          >
                            <ChevronDown className={`h-4 w-4 text-[#bbb] transition-transform duration-200 ${openCat === cat.id ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>
                      {openCat === cat.id && (
                        <div className="ml-4 border-l-2 border-[#e8e8e8] mt-1 space-y-0.5">
                          {cat.children.map((child) => (
                            <Link
                              key={child.id}
                              href={buildHref(child.slug, sortValue || undefined)}
                              onClick={() => setOpen(false)}
                              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${
                                selectedSlug === child.slug ? "text-[#F26522] font-bold" : "text-[#666] hover:text-[#1a1a1a]"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
                              {child.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Reset */}
            <div className="px-5 py-4 border-t border-[#e8e8e8] shrink-0">
              <Link
                href={base}
                onClick={() => setOpen(false)}
                className="block w-full text-center py-3 rounded-full border border-[#e8e8e8] text-sm font-bold text-[#666] hover:border-[#F26522]/30 hover:text-[#F26522] transition-colors"
              >
                Сбросить фильтры
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
