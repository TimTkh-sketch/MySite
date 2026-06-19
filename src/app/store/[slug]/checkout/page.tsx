import { notFound } from "next/navigation"
import { db } from "@/lib/db"
import { CheckoutClient } from "@/components/store/checkout-client"

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params

  const store = await db.store.findUnique({
    where: { slug, isActive: true },
    include: { settings: true },
  })
  if (!store) notFound()

  return <CheckoutClient store={store} />
}
