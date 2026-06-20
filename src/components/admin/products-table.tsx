"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight, Pencil, GripVertical } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { reorderProducts, updateProductPrice, updateVariantPrice } from "@/app/admin/products/actions"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

interface Variant {
  id: string
  name: string
  price: number | null
  stock: number
  sku: string | null
  image: string | null
}

interface Product {
  id: string
  name: string
  images: string[]
  price: number
  comparePrice: number | null
  stock: number
  isActive: boolean
  categoryId: string | null
  storeId: string
  category: { name: string } | null
  variants: Variant[]
}

function PriceCell({ value, onSave }: { value: number; onSave: (v: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [pending, startTransition] = useTransition()
  const [display, setDisplay] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  function commit() {
    const raw = parseFloat(ref.current?.value ?? "")
    if (isNaN(raw) || raw === display) { setEditing(false); return }
    startTransition(async () => {
      await onSave(raw)
      setDisplay(raw)
      setEditing(false)
    })
  }

  if (editing) {
    return (
      <input
        ref={ref}
        defaultValue={display}
        autoFocus
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className="w-28 px-2 py-0.5 text-sm border border-orange-400 rounded-lg outline-none ring-2 ring-orange-100 tabular-nums"
        disabled={pending}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="font-medium text-gray-900 hover:text-orange-600 transition-colors whitespace-nowrap group flex items-center gap-1"
      title="Нажмите чтобы изменить цену"
    >
      {formatPrice(display)}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  )
}

function SortableProductRow({ product }: { product: Product }) {
  const [expanded, setExpanded] = useState(false)

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ("relative" as const) : undefined,
    zIndex: isDragging ? 999 : undefined,
    backgroundColor: isDragging ? "#f9fafb" : undefined,
  }

  const variantCount = product.variants.length
  const variantPrices = product.variants.map((v) => v.price ?? product.price)
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : product.price
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : product.price
  const hasRange = maxPrice > minPrice

  return (
    <>
      <tr ref={setNodeRef} style={style} className="hover:bg-gray-50/80 transition-colors group">
        {/* Drag handle */}
        <td className="px-2 py-3 w-8">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors touch-none"
            title="Перетащить для сортировки"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>

        {/* Product name + image */}
        <td className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              {product.images[0] ? (
                <Image src={product.images[0]} alt={product.name} width={44} height={44} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
              )}
            </div>
            <div className="min-w-0">
              <Link href={`/admin/products/${product.id}`} className="font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-1">
                {product.name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                {product.category && (
                  <span className="text-xs text-gray-400 truncate">{product.category.name}</span>
                )}
                {variantCount > 0 && (
                  <button
                    onClick={() => setExpanded((v) => !v)}
                    className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100 shrink-0 transition-colors"
                  >
                    {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {variantCount} {variantCount === 1 ? "вариант" : variantCount < 5 ? "варианта" : "вариантов"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </td>

        {/* Price */}
        <td className="px-4 py-3 hidden md:table-cell">
          {variantCount > 0 ? (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="font-medium text-gray-900 hover:text-orange-600 transition-colors whitespace-nowrap text-left"
            >
              {hasRange ? `${formatPrice(minPrice)} — ${formatPrice(maxPrice)}` : formatPrice(minPrice)}
            </button>
          ) : (
            <PriceCell value={product.price} onSave={(v) => updateProductPrice(product.id, v)} />
          )}
          {product.comparePrice && !hasRange && !variantCount && (
            <p className="text-xs text-gray-400 line-through">{formatPrice(product.comparePrice)}</p>
          )}
        </td>

        {/* Stock */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className={`text-sm font-medium ${product.stock > 0 ? "text-green-600" : "text-red-500"}`}>
            {product.stock > 0 ? `${product.stock} шт.` : "Нет"}
          </span>
        </td>

        {/* Status */}
        <td className="px-4 py-3 hidden lg:table-cell">
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
            product.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {product.isActive ? "Активен" : "Скрыт"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 w-20">
          <div className="flex items-center gap-1.5 justify-end">
            <Link href={`/admin/products/${product.id}`}>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
            <DeleteProductButton id={product.id} />
          </div>
        </td>
      </tr>

      {/* Expanded variants */}
      {expanded && product.variants.map((variant) => {
        const variantImg = variant.image || product.images[0]
        return (
          <tr key={variant.id} className="bg-blue-50/40 border-l-2 border-l-blue-200">
            <td className="px-2 py-2" />
            <td className="px-4 py-2">
              <div className="flex items-center gap-3 pl-6">
                <div className="shrink-0 w-8 h-8 rounded-md overflow-hidden bg-white border border-gray-200">
                  {variantImg ? (
                    <Image src={variantImg} alt={variant.name} width={32} height={32} className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-100" />
                  )}
                </div>
                <div className="min-w-0">
                  <span className="text-sm text-gray-700 line-clamp-1">{variant.name}</span>
                  {variant.sku && <span className="text-xs text-gray-400 font-mono">{variant.sku}</span>}
                </div>
              </div>
            </td>
            <td className="px-4 py-2 hidden md:table-cell">
              <PriceCell
                value={variant.price ?? product.price}
                onSave={(v) => updateVariantPrice(variant.id, v)}
              />
            </td>
            <td className="px-4 py-2 hidden lg:table-cell">
              <span className={`text-sm ${variant.stock > 0 ? "text-green-600" : "text-red-400"}`}>
                {variant.stock > 0 ? `${variant.stock} шт.` : "Нет"}
              </span>
            </td>
            <td colSpan={2} />
          </tr>
        )
      })}
    </>
  )
}

export function ProductsTable({ products: initialProducts }: { products: Product[]; storeId: string }) {
  const [products, setProducts] = useState(initialProducts)
  const [, startTransition] = useTransition()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = products.findIndex((p) => p.id === active.id)
    const newIndex = products.findIndex((p) => p.id === over.id)
    const newOrder = arrayMove(products, oldIndex, newIndex)
    setProducts(newOrder)

    startTransition(() => reorderProducts(newOrder.map((p) => p.id)))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {products.length === 0 ? (
        <div className="p-16 text-center">
          <p className="text-gray-400">Товаров не найдено</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={products.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-400">
                  <th className="px-2 py-3 w-8" />
                  <th className="px-4 py-3">Товар</th>
                  <th className="px-4 py-3 hidden md:table-cell">Цена</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Остаток</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Статус</th>
                  <th className="px-4 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <SortableProductRow key={product.id} product={product} />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
