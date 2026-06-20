"use client"

import { useState, useTransition, useRef } from "react"
import Image from "next/image"
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import {
  saveVariant,
  deleteVariant,
  addOptionValue,
  removeOptionValue,
  addOptionGroup,
} from "@/app/admin/products/variant-actions"

interface Variant {
  id: string
  name: string
  value: string
  price: number | null
  stock: number
  sku: string | null
  image: string | null
}

interface OptionGroup {
  name: string
  values: string[]
}

function parseOptionGroups(variants: Variant[]): OptionGroup[] {
  const groups = new Map<string, Set<string>>()
  let keyOrder: string[] = []
  for (const v of variants) {
    try {
      const opts: Record<string, string> = JSON.parse(v.value)
      if (!keyOrder.length) keyOrder = Object.keys(opts)
      for (const [k, val] of Object.entries(opts)) {
        if (!groups.has(k)) groups.set(k, new Set())
        groups.get(k)!.add(val)
      }
    } catch {}
  }
  return keyOrder.map((k) => ({ name: k, values: [...(groups.get(k) ?? [])] }))
}

// ── Inline cell editor ─────────────────────────────────────────────────────────
function EditableCell({
  value,
  placeholder,
  onSave,
  className = "",
}: {
  value: string | number | null
  placeholder?: string
  onSave: (v: string) => void
  className?: string
}) {
  const [editing, setEditing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)
  const display = value !== null && value !== undefined && value !== "" ? String(value) : null

  function commit() {
    onSave(ref.current?.value ?? "")
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={ref}
        defaultValue={display ?? ""}
        autoFocus
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false) }}
        className={`px-2 py-0.5 text-sm border border-orange-400 rounded-lg outline-none ring-2 ring-orange-100 w-full ${className}`}
        placeholder={placeholder}
      />
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className={`text-sm text-left group flex items-center gap-1 w-full ${!display ? "text-gray-300 italic" : "text-gray-800"} ${className}`}
      title="Нажмите чтобы изменить"
    >
      <span className="truncate">{display ?? (placeholder ?? "—")}</span>
      <Pencil className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  )
}

// ── Option group editor ───────────────────────────────────────────────────────
function OptionGroupRow({
  group,
  productId,
  basePrice,
  onRefresh,
}: {
  group: OptionGroup
  productId: string
  basePrice: number
  onRefresh: () => void
}) {
  const [open, setOpen] = useState(false)
  const [newValue, setNewValue] = useState("")
  const [, startTransition] = useTransition()

  function handleAdd() {
    const val = newValue.trim()
    if (!val) return
    setNewValue("")
    startTransition(async () => {
      await addOptionValue(productId, group.name, val, basePrice)
      onRefresh()
    })
  }

  function handleRemove(val: string) {
    if (!confirm(`Удалить «${val}» и все связанные варианты?`)) return
    startTransition(async () => {
      await removeOptionValue(productId, group.name, val)
      onRefresh()
    })
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-start gap-3 text-left min-w-0">
          <span className="text-sm font-semibold text-gray-700 shrink-0 w-20">{group.name}</span>
          <span className="text-sm text-gray-500 truncate">{group.values.join(", ")}</span>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 bg-gray-50/60 border-t border-gray-100">
          <div className="flex flex-wrap gap-2 mb-3">
            {group.values.map((val) => (
              <span key={val} className="flex items-center gap-1 bg-white border border-gray-200 rounded-full px-3 py-1 text-sm">
                {val}
                <button
                  onClick={() => handleRemove(val)}
                  className="text-gray-300 hover:text-red-500 transition-colors ml-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
              placeholder={`Новое значение для «${group.name}»`}
              className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
            />
            <button
              onClick={handleAdd}
              disabled={!newValue.trim()}
              className="px-3 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              + Добавить
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            Добавление нового значения автоматически создаёт все комбинации вариантов
          </p>
        </div>
      )}
    </div>
  )
}

// ── Add new option group panel ───────────────────────────────────────────────
function AddOptionGroupPanel({ productId, basePrice, onRefresh, onClose }: {
  productId: string
  basePrice: number
  onRefresh: () => void
  onClose: () => void
}) {
  const [name, setName] = useState("")
  const [valuesText, setValuesText] = useState("")
  const [, startTransition] = useTransition()

  function handleSave() {
    const trimName = name.trim()
    const values = valuesText.split(",").map((v) => v.trim()).filter(Boolean)
    if (!trimName || !values.length) return
    startTransition(async () => {
      await addOptionGroup(productId, trimName, values, basePrice)
      onRefresh()
      onClose()
    })
  }

  return (
    <div className="border border-orange-200 rounded-xl p-4 bg-orange-50/40">
      <p className="text-sm font-semibold text-gray-800 mb-3">Новое свойство</p>
      <div className="space-y-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название свойства (напр. Цвет)"
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
        />
        <input
          value={valuesText}
          onChange={(e) => setValuesText(e.target.value)}
          placeholder="Значения через запятую (напр. Чёрный, Белый, Синий)"
          className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
        />
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleSave}
          disabled={!name.trim() || !valuesText.trim()}
          className="px-4 py-1.5 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Создать варианты
        </button>
        <button onClick={onClose} className="px-4 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors">
          Отмена
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Новое свойство будет скрещено со всеми существующими вариантами
      </p>
    </div>
  )
}

// ── Single variant row ────────────────────────────────────────────────────────
function VariantRow({ variant, productId, productImages, onDelete }: {
  variant: Variant
  productId: string
  productImages: string[]
  onDelete: (id: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [, startTransition] = useTransition()
  const [localData, setLocalData] = useState({
    price: variant.price,
    stock: variant.stock,
    sku: variant.sku,
    image: variant.image,
  })

  const thumbSrc = localData.image || productImages[0]

  function save(field: string, raw: string) {
    let value: string | number | null = raw
    if (field === "price") value = raw ? parseFloat(raw) : null
    if (field === "stock") value = raw ? parseInt(raw) : 0
    if (field === "image") value = raw || null

    const newData = { ...localData, [field]: value }
    setLocalData(newData as typeof localData)

    startTransition(async () => {
      await saveVariant(variant.id, { [field]: value as never })
    })
  }

  function handleDelete() {
    if (!confirm(`Удалить вариант «${variant.name}»?`)) return
    startTransition(async () => {
      await deleteVariant(variant.id, productId)
      onDelete(variant.id)
    })
  }

  return (
    <>
      <tr className="hover:bg-gray-50/80 group transition-colors">
        {/* Thumbnail */}
        <td className="px-3 py-2.5">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
            {thumbSrc ? (
              <Image src={thumbSrc} alt={variant.name} width={40} height={40} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-gray-300" />
              </div>
            )}
          </div>
        </td>

        {/* Name */}
        <td className="px-3 py-2.5">
          <p className="text-sm text-gray-800 font-medium line-clamp-1">{variant.name}</p>
          {localData.sku && <p className="text-xs text-gray-400 font-mono">{localData.sku}</p>}
        </td>

        {/* SKU */}
        <td className="px-3 py-2.5 hidden md:table-cell w-36">
          <EditableCell
            value={localData.sku}
            placeholder="Артикул"
            onSave={(v) => save("sku", v)}
          />
        </td>

        {/* Price */}
        <td className="px-3 py-2.5 w-32">
          <EditableCell
            value={localData.price !== null ? localData.price : ""}
            placeholder="Цена"
            onSave={(v) => save("price", v)}
            className="font-medium"
          />
        </td>

        {/* Stock */}
        <td className="px-3 py-2.5 hidden sm:table-cell w-24">
          <EditableCell
            value={localData.stock === 0 ? "" : localData.stock}
            placeholder="0"
            onSave={(v) => save("stock", v)}
          />
        </td>

        {/* Actions */}
        <td className="px-3 py-2.5 w-16">
          <div className="flex items-center gap-1 justify-end">
            <button
              onClick={() => setExpanded((v) => !v)}
              className={`p-1.5 rounded-lg transition-colors ${expanded ? "bg-orange-50 text-orange-500" : "text-gray-300 hover:text-gray-600 hover:bg-gray-100"}`}
              title="Изображение варианта"
            >
              <ImageIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Удалить вариант"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </td>
      </tr>

      {/* Expanded image URL editor */}
      {expanded && (
        <tr className="bg-orange-50/30">
          <td colSpan={6} className="px-3 pb-3 pt-1">
            <div className="flex items-center gap-3 pl-10">
              <ImageIcon className="h-4 w-4 text-gray-400 shrink-0" />
              <span className="text-xs text-gray-500 shrink-0">Фото этого варианта (URL):</span>
              <input
                defaultValue={localData.image ?? ""}
                placeholder="https://... (оставьте пустым для общего фото товара)"
                onBlur={(e) => save("image", e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur() }}
                className="flex-1 text-xs px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 bg-white"
              />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Main VariantManager ────────────────────────────────────────────────────────
export function VariantManager({
  variants: initialVariants,
  productId,
  productImages,
  basePrice,
}: {
  variants: Variant[]
  productId: string
  productImages: string[]
  basePrice: number
}) {
  const [variants, setVariants] = useState(initialVariants)
  const [showProps, setShowProps] = useState(false)
  const [showAddGroup, setShowAddGroup] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const optionGroups = parseOptionGroups(variants)

  function refresh() {
    setRefreshKey((k) => k + 1)
    // Reload the page to get fresh data from server
    window.location.reload()
  }

  function handleVariantDelete(id: string) {
    setVariants((vs) => vs.filter((v) => v.id !== id))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-gray-900">Варианты товара ({variants.length})</h3>
          {optionGroups.length > 0 && (
            <button
              onClick={() => setShowProps((v) => !v)}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border transition-colors ${
                showProps
                  ? "bg-orange-50 border-orange-200 text-orange-600"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              Свойства товара
              {showProps ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
        <button
          onClick={() => { setShowProps(true); setShowAddGroup(true) }}
          className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Добавить варианты
        </button>
      </div>

      {/* Properties panel */}
      {showProps && (
        <div className="px-5 py-4 bg-gray-50/60 border-b border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Свойства товара</p>

          {optionGroups.map((group) => (
            <OptionGroupRow
              key={group.name + refreshKey}
              group={group}
              productId={productId}
              basePrice={basePrice}
              onRefresh={refresh}
            />
          ))}

          {showAddGroup ? (
            <AddOptionGroupPanel
              productId={productId}
              basePrice={basePrice}
              onRefresh={refresh}
              onClose={() => setShowAddGroup(false)}
            />
          ) : (
            <button
              onClick={() => setShowAddGroup(true)}
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Добавить свойство
            </button>
          )}
        </div>
      )}

      {/* Variants table */}
      {variants.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          <p className="mb-2">Нет вариантов</p>
          <button
            onClick={() => { setShowProps(true); setShowAddGroup(true) }}
            className="text-blue-600 hover:underline"
          >
            Добавить свойство →
          </button>
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs font-medium text-gray-400 uppercase tracking-wide border-b border-gray-100 bg-gray-50/40">
              <th className="px-3 py-2.5 w-14" />
              <th className="px-3 py-2.5">Вариант</th>
              <th className="px-3 py-2.5 hidden md:table-cell">Артикул</th>
              <th className="px-3 py-2.5">Цена</th>
              <th className="px-3 py-2.5 hidden sm:table-cell">Остаток</th>
              <th className="px-3 py-2.5 w-16" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {variants.map((v) => (
              <VariantRow
                key={v.id}
                variant={v}
                productId={productId}
                productImages={productImages}
                onDelete={handleVariantDelete}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
