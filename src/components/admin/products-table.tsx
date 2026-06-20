"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight, Pencil, GripVertical, MoreHorizontal, Eye, EyeOff, FolderInput, ChevronsUp, ChevronsDown } from "lucide-react"
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
import {
  reorderProducts,
  updateProductPrice,
  updateVariantPrice,
  toggleProductActive,
  moveProductToCategory,
  moveProductToStart,
  moveProductToEnd,
} from "@/app/admin/products/actions"
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

interface Category {
  id: string
  name: string
  parentId: string | null
}

// ── Price cell ────────────────────────────────────────────────────────────────
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
    >
      {formatPrice(display)}
      <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  )
}

// ── Category picker modal ─────────────────────────────────────────────────────
function CategoryPicker({ categories, onSelect, onClose }: {
  categories: Category[]
  onSelect: (id: string | null) => void
  onClose: () => void
}) {
  const roots = categories.filter((c) => !c.parentId)
  const children = (parentId: string) => categories.filter((c) => c.parentId === parentId)

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-80 max-h-[70vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-900 text-sm">Перенести в категорию</p>
        </div>
        <div className="overflow-y-auto max-h-[50vh]">
          {roots.map((root) => (
            <div key={root.id}>
              <button
                onClick={() => { onSelect(root.id); onClose() }}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-orange-50 hover:text-orange-600 transition-colors"
              >
                {root.name}
              </button>
              {children(root.id).map((child) => (
                <button
                  key={child.id}
                  onClick={() => { onSelect(child.id); onClose() }}
                  className="w-full text-left pl-8 pr-4 py-2 text-sm text-gray-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  {child.name}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="px-4 py-3 border-t border-gray-100">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Отмена</button>
        </div>
      </div>
    </div>
  )
}

// ── Actions dropdown ──────────────────────────────────────────────────────────
function ActionsDropdown({ product, allCategories, onActiveChange }: {
  product: Product
  allCategories: Category[]
  onActiveChange: (isActive: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const [, startTransition] = useTransition()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [open])

  function action(fn: () => Promise<void>) {
    setOpen(false)
    startTransition(fn)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        title="Действия"
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-40 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
          {/* Hide / Show */}
          <button
            onClick={() => action(async () => {
              await toggleProductActive(product.id, !product.isActive)
              onActiveChange(!product.isActive)
            })}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            {product.isActive
              ? <><EyeOff className="h-4 w-4 text-gray-400" /><span>Скрыть на сайте</span></>
              : <><Eye className="h-4 w-4 text-gray-400" /><span>Показать на сайте</span></>
            }
          </button>

          <div className="my-1 border-t border-gray-50" />

          {/* Move in category */}
          <button
            onClick={() => { setOpen(false); action(async () => { await moveProductToStart(product.id, product.categoryId, product.storeId) }) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            <ChevronsUp className="h-4 w-4 text-gray-400" />
            <span>В начало категории</span>
          </button>
          <button
            onClick={() => action(async () => { await moveProductToEnd(product.id, product.categoryId, product.storeId) })}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            <ChevronsDown className="h-4 w-4 text-gray-400" />
            <span>В конец категории</span>
          </button>

          <div className="my-1 border-t border-gray-50" />

          {/* Move to another category */}
          <button
            onClick={() => { setOpen(false); setShowCategoryPicker(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 text-left transition-colors"
          >
            <FolderInput className="h-4 w-4 text-gray-400" />
            <span>Перенести в категорию</span>
          </button>
        </div>
      )}

      {showCategoryPicker && (
        <CategoryPicker
          categories={allCategories}
          onSelect={(id) => {
            startTransition(async () => { await moveProductToCategory(product.id, id) })
          }}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </div>
  )
}

// ── Sortable row ──────────────────────────────────────────────────────────────
function SortableProductRow({ product, allCategories }: { product: Product; allCategories: Category[] }) {
  const [expanded, setExpanded] = useState(false)
  const [isActive, setIsActive] = useState(product.isActive)

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
      <tr ref={setNodeRef} style={style} className={`hover:bg-gray-50/80 transition-colors group ${!isActive ? "opacity-60" : ""}`}>
        {/* Drag handle */}
        <td className="px-2 py-3 w-8">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors touch-none"
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
            isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "Активен" : "Скрыт"}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3 w-24">
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/admin/products/${product.id}`}>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
            <DeleteProductButton id={product.id} />
            <ActionsDropdown
              product={{ ...product, isActive }}
              allCategories={allCategories}
              onActiveChange={setIsActive}
            />
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

// ── Main export ───────────────────────────────────────────────────────────────
export function ProductsTable({
  products: initialProducts,
  storeId: _storeId,
  allCategories,
}: {
  products: Product[]
  storeId: string
  allCategories: Category[]
}) {
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
                  <th className="px-4 py-3 w-24" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <SortableProductRow key={product.id} product={product} allCategories={allCategories} />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
