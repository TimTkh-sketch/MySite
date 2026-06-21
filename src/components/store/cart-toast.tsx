"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ShoppingCart } from "lucide-react"
import { useCart } from "./cart-provider"
import { formatPrice } from "@/lib/utils"

export function CartToast({ storeSlug }: { storeSlug: string }) {
  const { lastAdded } = useCart()
  const [visible, setVisible] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [item, setItem] = useState(lastAdded)

  useEffect(() => {
    if (!lastAdded) return
    setItem(lastAdded); setLeaving(false); setVisible(true)
    const hide = setTimeout(() => { setLeaving(true); setTimeout(() => setVisible(false), 260) }, 2800)
    return () => clearTimeout(hide)
  }, [lastAdded])

  if (!visible || !item) return null

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100vw-2rem)] max-w-sm pointer-events-none">
      <div className={`pointer-events-auto glass-bright rounded-2xl px-4 py-3 flex items-center gap-3 ${leaving ? "animate-toast-out" : "animate-toast-in"}`}
        style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}>
        <div className="w-12 h-12 rounded-xl overflow-hidden glass shrink-0">
          {item.image ? (
            <Image src={item.image} alt={item.name} width={48} height={48} className="object-contain p-1.5 w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="h-5 w-5 text-[#bbb]" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#1a1a1a] truncate">{item.name}</p>
          <p className="text-xs text-[#666]">{formatPrice(item.price)} · Добавлено</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded-full bg-emerald-500/80 flex items-center justify-center">
            <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />
          </div>
          <Link href={`/store/${storeSlug}/checkout`}
            className="text-xs font-bold text-[#F26522] hover:text-[#d94f00] whitespace-nowrap transition-colors">
            Корзина →
          </Link>
        </div>
      </div>
    </div>
  )
}
