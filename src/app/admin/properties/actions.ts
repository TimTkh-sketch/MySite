"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"

export async function addPropertyValue(storeId: string, property: string, value: string) {
  const trimmed = value.trim()
  if (!trimmed) return
  const agg = await db.propertyValue.aggregate({
    where: { storeId, property },
    _max: { sortOrder: true },
  })
  await db.propertyValue.upsert({
    where: { storeId_property_value: { storeId, property, value: trimmed } },
    create: { storeId, property, value: trimmed, sortOrder: (agg._max.sortOrder ?? -1) + 1 },
    update: {},
  })
  revalidatePath(`/admin/properties/${encodeURIComponent(property)}`)
}

export async function updatePropertyValue(id: string, value: string, property: string) {
  const trimmed = value.trim()
  if (!trimmed) return
  await db.propertyValue.update({ where: { id }, data: { value: trimmed } })
  revalidatePath(`/admin/properties/${encodeURIComponent(property)}`)
}

export async function deletePropertyValue(id: string, property: string) {
  await db.propertyValue.delete({ where: { id } })
  revalidatePath(`/admin/properties/${encodeURIComponent(property)}`)
  revalidatePath("/admin/properties")
}

export async function reorderPropertyValues(ids: string[], property: string) {
  await Promise.all(
    ids.map((id, index) => db.propertyValue.update({ where: { id }, data: { sortOrder: index } }))
  )
  revalidatePath(`/admin/properties/${encodeURIComponent(property)}`)
}

export async function createProperty(storeId: string, property: string, values: string[]) {
  const trimmedProp = property.trim()
  if (!trimmedProp) return
  const existing = await db.propertyValue.count({ where: { storeId, property: trimmedProp } })
  await Promise.all(
    values
      .map((v) => v.trim())
      .filter(Boolean)
      .map((value, index) =>
        db.propertyValue.upsert({
          where: { storeId_property_value: { storeId, property: trimmedProp, value } },
          create: { storeId, property: trimmedProp, value, sortOrder: existing + index },
          update: {},
        })
      )
  )
  revalidatePath("/admin/properties")
  revalidatePath(`/admin/properties/${encodeURIComponent(trimmedProp)}`)
}
