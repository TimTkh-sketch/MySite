"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

interface WishlistCtx {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  count: number
}

const Ctx = createContext<WishlistCtx>({ ids: [], toggle: () => {}, has: () => false, count: 0 })

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wishlist")
      if (raw) setIds(JSON.parse(raw))
    } catch {}
  }, [])

  const toggle = useCallback((id: string) => {
    setIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      try { localStorage.setItem("wishlist", JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  const has = useCallback((id: string) => ids.includes(id), [ids])

  return (
    <Ctx.Provider value={{ ids, toggle, has, count: ids.length }}>
      {children}
    </Ctx.Provider>
  )
}

export const useWishlist = () => useContext(Ctx)
