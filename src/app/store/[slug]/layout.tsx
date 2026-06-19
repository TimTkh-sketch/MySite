import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { StoreHeader } from "@/components/store/header"
import { StoreFooter } from "@/components/store/footer"
import { CartProvider } from "@/components/store/cart-provider"

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

  return (
    <CartProvider storeId={store.id}>
      <div className="flex min-h-screen flex-col" style={{ "--primary": store.primaryColor, "--accent": store.accentColor } as React.CSSProperties}>
        <StoreHeader store={store} />
        <main className="flex-1">{children}</main>
        <StoreFooter store={store} />
      </div>
    </CartProvider>
  )
}
