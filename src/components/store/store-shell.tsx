"use client"

import { useState } from "react"
import { MobileNav } from "./mobile-nav"
import { CartToast } from "./cart-toast"
import { SearchOverlay } from "./search-overlay"

export function StoreShell({ storeSlug }: { storeSlug: string }) {
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <>
      <CartToast storeSlug={storeSlug} />
      <MobileNav storeSlug={storeSlug} onSearchOpen={() => setSearchOpen(true)} />
      {searchOpen && <SearchOverlay storeSlug={storeSlug} onClose={() => setSearchOpen(false)} />}
      {/* Spacer so content isn't hidden behind mobile nav */}
      <div className="h-16 lg:hidden" />
    </>
  )
}
