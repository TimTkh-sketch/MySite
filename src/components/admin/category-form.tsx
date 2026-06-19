"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { slugify } from "@/lib/utils"

interface Store { id: string; name: string }
interface Category { id: string; name: string; storeId: string }

interface CategoryFormProps {
  stores: Store[]
  categories: Category[]
  category?: {
    id: string
    storeId: string
    parentId?: string | null
    name: string
    slug: string
    description?: string | null
    isActive: boolean
    sortOrder: number
  }
}

export function CategoryForm({ stores, categories, category }: CategoryFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [storeId, setStoreId] = useState(category?.storeId ?? stores[0]?.id ?? "")
  const [parentId, setParentId] = useState(category?.parentId ?? "")
  const [name, setName] = useState(category?.name ?? "")
  const [slug, setSlug] = useState(category?.slug ?? "")
  const [description, setDescription] = useState(category?.description ?? "")
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const [sortOrder, setSortOrder] = useState(category?.sortOrder?.toString() ?? "0")

  const parentCategories = categories.filter((c) => c.storeId === storeId)

  function handleNameChange(value: string) {
    setName(value)
    if (!category) setSlug(slugify(value))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body = {
      storeId,
      parentId: parentId || null,
      name,
      slug,
      description: description || null,
      isActive,
      sortOrder: parseInt(sortOrder),
    }

    const url = category ? `/api/categories/${category.id}` : "/api/categories"
    const method = category ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "Ошибка при сохранении")
      setLoading(false)
      return
    }

    router.push("/admin/categories")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Магазин *</Label>
            <Select value={storeId} onValueChange={setStoreId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {stores.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Родительская категория</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue placeholder="Нет (корневая)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Нет (корневая)</SelectItem>
                {parentCategories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="catName">Название *</Label>
            <Input
              id="catName"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Смартфоны"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="catSlug">Слаг *</Label>
            <Input
              id="catSlug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="smartfony"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sortOrder">Порядок сортировки</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="catDesc">Описание</Label>
          <Textarea
            id="catDesc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300"
          />
          <span className="text-sm font-medium text-gray-700">Активна</span>
        </label>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Сохранение..." : category ? "Сохранить" : "Создать"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
