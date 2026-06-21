"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function saveStoreSettings(
  storeId: string,
  data: {
    name: string
    primaryColor: string
    accentColor: string
    phone?: string | null
    address?: string | null
    workingHours?: string | null
    metaTitle?: string | null
    metaDesc?: string | null
    socialVk?: string | null
    socialTg?: string | null
    yandexMetrika?: string | null
    freeShippingFrom?: number | null
    shippingCost?: number | null
  }
) {
  const session = await auth()
  if (!session?.user) throw new Error("Unauthorized")

  const { name, primaryColor, accentColor, ...settingsData } = data

  await db.store.update({
    where: { id: storeId },
    data: { name, primaryColor, accentColor },
  })

  await db.storeSettings.upsert({
    where: { storeId },
    create: { storeId, ...settingsData },
    update: settingsData,
  })

  revalidatePath("/admin/settings")
  revalidatePath(`/store`)
}
