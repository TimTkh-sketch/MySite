"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Search, X, ArrowUpRight } from "lucide-react"
import { formatPrice } from "@/lib/utils"

interface SearchResult { id: string; name: string; slug: string; price: number; images: string[] }

export function SearchOverlay({ storeSlug, onClose }: { storeSlug: string; onClose: () => void }) {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) { setResults([]); return }
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&storeSlug=${storeSlug}`)
        setResults((await res.json()).products ?? [])
      } catch { setResults([]) }
      setLoading(false)
    }, 280)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, storeSlug])

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    window.addEventListener("keydown", fn)
    return () => window.removeEventListener("keydown", fn)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[200] flex flex-col">
      <div className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />
      <div className="relative mt-20 mx-auto w-full max-w-2xl px-4 animate-search-in">
        <div className="glass-bright rounded-2xl overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.12)" }}>
          {/* Input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[#e8e8e8]">
            <Search className="h-4 w-4 text-[#999] shrink-0" />
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск товаров..."
              className="flex-1 text-sm text-[#1a1a1a] placeholder-[#bbb] bg-transparent outline-none font-medium" />
            {loading && <div className="w-4 h-4 border-2 border-[#F26522]/40 border-t-transparent rounded-full animate-spin shrink-0" />}
            <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[#f5f5f5] transition-colors active:scale-90 shrink-0">
              <X className="h-4 w-4 text-[#666]" />
            </button>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-[55vh] overflow-y-auto divide-y divide-[#f0f0f0]">
              {results.map((p) => (
                <Link key={p.id} href={`/store/${storeSlug}/product/${p.slug}`} onClick={onClose}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[#f8f8f8] transition-colors group">
                  <div className="w-12 h-12 rounded-xl overflow-hidden glass shrink-0">
                    {p.images[0] && <Image src={p.images[0]} alt={p.name} width={48} height={48} className="object-contain p-1.5 w-full h-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1a1a1a] line-clamp-1">{p.name}</p>
                    <p className="text-sm font-black text-[#1a1a1a]">{formatPrice(p.price)}</p>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#bbb] group-hover:text-[#F26522] transition-colors shrink-0" />
                </Link>
              ))}
              <div className="px-4 py-2.5">
                <Link href={`/store/${storeSlug}/catalog?q=${encodeURIComponent(query)}`} onClick={onClose}
                  className="text-xs font-bold text-[#666] hover:text-[#F26522] transition-colors">
                  Смотреть все по «{query}» →
                </Link>
              </div>
            </div>
          )}

          {query.trim().length >= 2 && !loading && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-[#999]">Ничего не найдено по «{query}»</div>
          )}

          {query.trim().length < 2 && (
            <div className="px-4 py-4">
              <p className="label-tag mb-3 text-[#999]">ПОПУЛЯРНЫЕ ЗАПРОСЫ</p>
              <div className="flex flex-wrap gap-2">
                {["iPhone", "Samsung", "Xiaomi", "Наушники", "Чехлы"].map((s) => (
                  <button key={s} onClick={() => setQuery(s)}
                    className="btn-glass px-3 py-1.5 rounded-full text-xs text-[#666] hover:text-[#F26522] active:scale-95 transition-all"
                    style={{ borderRadius: 100 }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
