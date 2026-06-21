"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function toggleFeatured(productId: string, isFeatured: boolean) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  await db.product.update({ where: { id: productId }, data: { isFeatured } })
  revalidatePath("/admin/homepage")
}
