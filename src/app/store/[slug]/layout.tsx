import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { StoreHeader } from "@/components/store/header"
import { StoreFooter } from "@/components/store/footer"
import { CartProvider } from "@/components/store/cart-provider"
import { StoreShell } from "@/components/store/store-shell"
import { AtmosphericBackground } from "@/components/store/atmospheric-bg"
import { SmoothScroll } from "@/components/ui/smooth-scroll"
import { PageTransition } from "@/components/store/page-transition"
import { CustomCursor } from "@/components/store/custom-cursor"
import { CartFlyAnimation } from "@/components/store/cart-fly-animation"
import { WishlistProvider } from "@/components/store/wishlist-provider"
import { GoogleTranslate } from "@/components/store/google-translate"
import { ChatWidget } from "@/components/chat/chat-widget"
import { PromoPopup } from "@/components/store/promo-popup"
import { getCursorConfig } from "@/lib/cursor-config"

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    include: {
      settings: true,
      categories: {
        where: { isActive: true, parentId: null },
        orderBy: { sortOrder: "asc" },
        include: {
          children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
        },
      },
    },
  })

  if (!store) notFound()

  const cursorConfig = getCursorConfig()

  return (
    <SmoothScroll>
      <WishlistProvider>
      <CartProvider storeId={store.id}>
        <AtmosphericBackground />
        <div
          className="flex min-h-screen flex-col"
          style={{ "--primary": store.primaryColor, "--accent": store.accentColor } as React.CSSProperties}
        >
          <StoreHeader store={store} />
          <main className="flex-1 pt-14 sm:pt-16">
            <PageTransition>{children}</PageTransition>
          </main>
          <StoreFooter store={store} />
          <StoreShell storeSlug={slug} />
        </div>
        <CustomCursor config={cursorConfig} />
        <CartFlyAnimation />
        <GoogleTranslate />
        <ChatWidget storeId={store.id} />
        <PromoPopup />
      </CartProvider>
      </WishlistProvider>
    </SmoothScroll>
  )
}
