"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { slugify } from "@/lib/utils"
import { X, Upload } from "lucide-react"

interface Store { id: string; name: string }
interface Category { id: string; name: string; storeId: string }

interface ProductFormProps {
  stores: Store[]
  categories: Category[]
  product?: {
    id: string
    storeId: string
    categoryId?: string | null
    name: string
    slug: string
    description?: string | null
    price: number
    comparePrice?: number | null
    sku?: string | null
    stock: number
    isActive: boolean
    isFeatured: boolean
    images: string[]
    tags: string[]
  }
}

export function ProductForm({ stores, categories, product }: ProductFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)

  const [storeId, setStoreId] = useState(product?.storeId ?? stores[0]?.id ?? "")
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? "")
  const [name, setName] = useState(product?.name ?? "")
  const [slug, setSlug] = useState(product?.slug ?? "")
  const [description, setDescription] = useState(product?.description ?? "")
  const [price, setPrice] = useState(product?.price?.toString() ?? "")
  const [comparePrice, setComparePrice] = useState(product?.comparePrice?.toString() ?? "")
  const [sku, setSku] = useState(product?.sku ?? "")
  const [stock, setStock] = useState(product?.stock?.toString() ?? "0")
  const [isActive, setIsActive] = useState(product?.isActive ?? true)
  const [isFeatured, setIsFeatured] = useState(product?.isFeatured ?? false)
  const [images, setImages] = useState<string[]>(product?.images ?? [])
  const [tags, setTags] = useState(product?.tags?.join(", ") ?? "")

  const filteredCategories = categories.filter((c) => c.storeId === storeId)

  function handleNameChange(value: string) {
    setName(value)
    if (!product) setSlug(slugify(value))
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return

    setUploadingImage(true)
    const formData = new FormData()
    formData.append("file", files[0])

    const res = await fetch("/api/upload", { method: "POST", body: formData })
    const data = await res.json()

    if (data.url) {
      setImages((prev) => [...prev, data.url])
    }
    setUploadingImage(false)
    e.target.value = ""
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")

    const body = {
      storeId,
      categoryId: categoryId || null,
      name,
      slug,
      description: description || null,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      sku: sku || null,
      stock: parseInt(stock),
      isActive,
      isFeatured,
      images,
      tags: tags ? tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    }

    const url = product ? `/api/products/${product.id}` : "/api/products"
    const method = product ? "PATCH" : "POST"

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

    router.push("/admin/products")
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Основное</h2>

            <div className="space-y-1.5">
              <Label htmlFor="name">Название *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Название товара"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="slug">Слаг *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="product-slug"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Подробное описание товара..."
                rows={5}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Теги (через запятую)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="смартфон, apple, iphone"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Фотографии</h2>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {images.map((img, i) => (
                <div key={i} className="relative group rounded-lg overflow-hidden border border-gray-200 aspect-square">
                  <Image src={img} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 bg-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                  >
                    <X className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                </div>
              ))}

              <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 aspect-square cursor-pointer hover:border-gray-400 transition-colors">
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {uploadingImage ? (
                  <span className="text-xs text-gray-400">Загрузка...</span>
                ) : (
                  <>
                    <Upload className="h-5 w-5 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Добавить</span>
                  </>
                )}
              </label>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Магазин и категория</h2>

            <div className="space-y-1.5">
              <Label>Магазин *</Label>
              <Select value={storeId} onValueChange={setStoreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите магазин" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Категория</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Без категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Без категории</SelectItem>
                  {filteredCategories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Цена и остаток</h2>

            <div className="space-y-1.5">
              <Label htmlFor="price">Цена (₽) *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="1990"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comparePrice">Старая цена (₽)</Label>
              <Input
                id="comparePrice"
                type="number"
                step="0.01"
                value={comparePrice}
                onChange={(e) => setComparePrice(e.target.value)}
                placeholder="2990"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="stock">Остаток (шт.)</Label>
              <Input
                id="stock"
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="10"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sku">Артикул</Label>
              <Input
                id="sku"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="SKU-001"
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Настройки</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Активен (виден на сайте)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">Хит продаж</span>
            </label>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "Сохранение..." : product ? "Сохранить" : "Создать товар"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Отмена
        </Button>
      </div>
    </form>
  )
}
