"use client"

import { useState, useTransition, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { createPortal } from "react-dom"
import {
  ChevronDown, ChevronRight, Pencil, GripVertical,
  Eye, EyeOff, FolderInput, Trash2, X,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  useSortable, verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  reorderProducts, updateProductPrice, updateVariantPrice,
  toggleProductActive, moveProductToCategory,
  bulkToggleActive, bulkMoveToCategory, bulkDelete,
} from "@/app/admin/products/actions"
import { DeleteProductButton } from "@/components/admin/delete-product-button"

interface Variant {
  id: string
  name: string
  value: string
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
  colorImages: Record<string, string[]>
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
    startTransition(async () => { await onSave(raw); setDisplay(raw); setEditing(false) })
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

  return createPortal(
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-80 max-h-[70vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <p className="font-semibold text-gray-900 text-sm">Перенести в категорию</p>
        </div>
        <div className="overflow-y-auto flex-1">
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
        <div className="px-4 py-3 border-t border-gray-100 shrink-0">
          <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-700">Отмена</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Bulk toolbar ──────────────────────────────────────────────────────────────
function BulkToolbar({
  selectedIds,
  allCategories,
  onHide,
  onShow,
  onDelete,
  onMoveToCategory,
  onClear,
}: {
  selectedIds: Set<string>
  allCategories: Category[]
  onHide: () => void
  onShow: () => void
  onDelete: () => void
  onMoveToCategory: (id: string | null) => void
  onClear: () => void
}) {
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)
  const count = selectedIds.size

  if (count === 0) return null

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border-b border-blue-100">
      {/* Count */}
      <span className="text-sm font-medium text-blue-700 shrink-0">
        Выбрано: {count} {count === 1 ? "товар" : count < 5 ? "товара" : "товаров"}
      </span>

      <div className="flex items-center gap-1 flex-wrap">
        {/* Show */}
        <button
          onClick={onShow}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          title="Показать выбранные"
        >
          <Eye className="h-3.5 w-3.5 text-green-500" />
          Показать
        </button>

        {/* Hide */}
        <button
          onClick={onHide}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
          title="Скрыть выбранные"
        >
          <EyeOff className="h-3.5 w-3.5 text-gray-400" />
          Скрыть
        </button>

        {/* Move to category */}
        <button
          onClick={() => setShowCategoryPicker(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
        >
          <FolderInput className="h-3.5 w-3.5 text-blue-500" />
          Перенести
        </button>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-100 bg-white hover:bg-red-50 text-red-600 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Удалить
        </button>
      </div>

      {/* Clear selection */}
      <button
        onClick={onClear}
        className="ml-auto p-1 rounded text-blue-400 hover:text-blue-700 transition-colors shrink-0"
        title="Снять выделение"
      >
        <X className="h-4 w-4" />
      </button>

      {showCategoryPicker && (
        <CategoryPicker
          categories={allCategories}
          onSelect={onMoveToCategory}
          onClose={() => setShowCategoryPicker(false)}
        />
      )}
    </div>
  )
}

// ── Sortable row ──────────────────────────────────────────────────────────────
function SortableProductRow({
  product,
  allCategories,
  isSelected,
  onSelect,
}: {
  product: Product
  allCategories: Category[]
  isSelected: boolean
  onSelect: (id: string, checked: boolean) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [isActive, setIsActive] = useState(product.isActive)
  const [mounted, setMounted] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => setMounted(true), [])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: product.id })

  const style = mounted ? {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ("relative" as const) : undefined,
    zIndex: isDragging ? 999 : undefined,
    backgroundColor: isDragging ? "#f9fafb" : undefined,
  } : {}

  const variantCount = product.variants.length
  const variantPrices = product.variants.map((v) => v.price ?? product.price)
  const minPrice = variantPrices.length ? Math.min(...variantPrices) : product.price
  const maxPrice = variantPrices.length ? Math.max(...variantPrices) : product.price
  const hasRange = maxPrice > minPrice

  return (
    <>
      <tr
        ref={setNodeRef}
        style={style}
        className={`hover:bg-gray-50/80 transition-colors group ${!isActive ? "opacity-60" : ""} ${isSelected ? "bg-blue-50/60" : ""}`}
      >
        {/* Checkbox */}
        <td className="px-3 py-3 w-10">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => onSelect(product.id, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
            onClick={(e) => e.stopPropagation()}
          />
        </td>

        {/* Drag handle */}
        <td className="px-1 py-3 w-8">
          <button
            {...(mounted ? attributes : {})}
            {...(mounted ? listeners : {})}
            className="cursor-grab active:cursor-grabbing p-1 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors touch-none"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </td>

        {/* Photo + Name */}
        <td className="px-3 py-3">
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-11 h-11 rounded-lg overflow-hidden bg-gray-100 border border-gray-100">
              {product.images[0] ? (
                <Image src={product.images[0]} alt={product.name} width={44} height={44} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">—</div>
              )}
            </div>
            <div className="min-w-0">
              <Link
                href={`/admin/products/${product.id}`}
                className="font-medium text-gray-900 hover:text-orange-600 transition-colors line-clamp-1"
              >
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
          <button
            onClick={() => startTransition(async () => {
              await toggleProductActive(product.id, !isActive)
              setIsActive((v) => !v)
            })}
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
              isActive ? "bg-green-50 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
            title={isActive ? "Нажмите чтобы скрыть" : "Нажмите чтобы показать"}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-green-500" : "bg-gray-400"}`} />
            {isActive ? "Активен" : "Скрыт"}
          </button>
        </td>

        {/* Actions */}
        <td className="px-3 py-3 w-20">
          <div className="flex items-center gap-1 justify-end">
            <Link href={`/admin/products/${product.id}`}>
              <button className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors" title="Редактировать">
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </Link>
            <DeleteProductButton id={product.id} />
          </div>
        </td>
      </tr>

      {/* Expanded variants */}
      {expanded && product.variants.map((variant) => {
        let colorValue: string | null = null
        try {
          const opts = JSON.parse(variant.value) as Record<string, string>
          colorValue = opts["Цвет"] ?? null
        } catch {}
        const colorImgs = colorValue ? (product.colorImages[colorValue] ?? []) : []
        const variantImg = colorImgs[0] ?? variant.image ?? product.images[0]
        return (
          <tr key={variant.id} className="bg-blue-50/40 border-l-2 border-l-blue-200">
            <td className="px-3 py-2" colSpan={2} />
            <td className="px-3 py-2">
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
              <PriceCell value={variant.price ?? product.price} onSave={(v) => updateVariantPrice(variant.id, v)} />
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const masterCheckboxRef = useRef<HTMLInputElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  // Master checkbox indeterminate state
  useEffect(() => {
    if (!masterCheckboxRef.current) return
    masterCheckboxRef.current.indeterminate = selectedIds.size > 0 && selectedIds.size < products.length
  }, [selectedIds.size, products.length])

  function handleSelect(id: string, checked: boolean) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function handleSelectAll(checked: boolean) {
    setSelectedIds(checked ? new Set(products.map((p) => p.id)) : new Set())
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = products.findIndex((p) => p.id === active.id)
    const newIndex = products.findIndex((p) => p.id === over.id)
    const newOrder = arrayMove(products, oldIndex, newIndex)
    setProducts(newOrder)
    startTransition(() => reorderProducts(newOrder.map((p) => p.id)))
  }

  // Bulk actions
  function handleBulkShow() {
    const ids = [...selectedIds]
    setProducts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, isActive: true } : p))
    setSelectedIds(new Set())
    startTransition(() => bulkToggleActive(ids, true))
  }

  function handleBulkHide() {
    const ids = [...selectedIds]
    setProducts((prev) => prev.map((p) => ids.includes(p.id) ? { ...p, isActive: false } : p))
    setSelectedIds(new Set())
    startTransition(() => bulkToggleActive(ids, false))
  }

  function handleBulkDelete() {
    const ids = [...selectedIds]
    if (!confirm(`Удалить ${ids.length} ${ids.length === 1 ? "товар" : "товаров"}? Это действие необратимо.`)) return
    setProducts((prev) => prev.filter((p) => !ids.includes(p.id)))
    setSelectedIds(new Set())
    startTransition(() => bulkDelete(ids))
  }

  function handleBulkMoveToCategory(categoryId: string | null) {
    const ids = [...selectedIds]
    const cat = allCategories.find((c) => c.id === categoryId)
    setProducts((prev) => prev.map((p) =>
      ids.includes(p.id) ? { ...p, categoryId, category: cat ? { name: cat.name } : null } : p
    ))
    setSelectedIds(new Set())
    startTransition(() => bulkMoveToCategory(ids, categoryId))
  }

  const allSelected = products.length > 0 && selectedIds.size === products.length

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Bulk action toolbar */}
      <BulkToolbar
        selectedIds={selectedIds}
        allCategories={allCategories}
        onShow={handleBulkShow}
        onHide={handleBulkHide}
        onDelete={handleBulkDelete}
        onMoveToCategory={handleBulkMoveToCategory}
        onClear={() => setSelectedIds(new Set())}
      />

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
                  {/* Master checkbox */}
                  <th className="px-3 py-3 w-10">
                    <input
                      ref={masterCheckboxRef}
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                    />
                  </th>
                  <th className="px-1 py-3 w-8" />
                  <th className="px-3 py-3">Товар</th>
                  <th className="px-4 py-3 hidden md:table-cell">Цена</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Остаток</th>
                  <th className="px-4 py-3 hidden lg:table-cell">Статус</th>
                  <th className="px-3 py-3 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((product) => (
                  <SortableProductRow
                    key={product.id}
                    product={product}
                    allCategories={allCategories}
                    isSelected={selectedIds.has(product.id)}
                    onSelect={handleSelect}
                  />
                ))}
              </tbody>
            </table>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}
