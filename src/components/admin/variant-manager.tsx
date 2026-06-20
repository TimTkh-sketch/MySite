"use client"

import { useState, useTransition, useRef } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronUp, Image as ImageIcon } from "lucide-react"
import { formatPrice } from "@/lib/utils"
import {
  saveVariant,
  deleteVariant,
  addOptionValue,
  removeOptionValue,
  addOptionGroup,
  setColorImages as saveColorImagesAction,
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

// ── Multi-image picker modal ──────────────────────────────────────────────────
function MultiImagePickerModal({
  title,
  productImages,
  selectedImages,
  onSave,
  onClose,
}: {
  title: string
  productImages: string[]
  selectedImages: string[]
  onSave: (imgs: string[]) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set(selectedImages))

  function toggle(img: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(img)) next.delete(img)
      else next.add(img)
      return next
    })
  }

  function selectAll() { setSelected(new Set(productImages)) }
  function clearAll() { setSelected(new Set()) }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">Выберите все фото этого цвета</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Select all / Clear */}
        <div className="flex items-center gap-3 px-5 py-2 border-b border-gray-100 bg-gray-50/50">
          <button
            type="button"
            onClick={selected.size === productImages.length ? clearAll : selectAll}
            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
              selected.size === productImages.length
                ? "bg-blue-500 border-blue-500"
                : "border-gray-300"
            }`}>
              {selected.size === productImages.length && <Check className="h-2.5 w-2.5 text-white" />}
              {selected.size > 0 && selected.size < productImages.length && (
                <div className="w-2 h-0.5 bg-blue-500" />
              )}
            </div>
            Выбрать все
          </button>
          <span className="text-xs text-gray-400">Выбрано: {selected.size} из {productImages.length}</span>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {productImages.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>У товара нет фотографий.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {productImages.map((img) => {
                const isSelected = selected.has(img)
                return (
                  <button
                    key={img}
                    type="button"
                    onClick={() => toggle(img)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${
                      isSelected ? "border-blue-500 shadow-sm" : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="120px" className="object-contain p-1" />
                    <div className={`absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center shadow transition-all ${
                      isSelected ? "bg-blue-500 opacity-100" : "bg-white/80 border border-gray-300 opacity-60"
                    }`}>
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={clearAll}
            className="text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Убрать все фото
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
              Отмена
            </button>
            <button
              type="button"
              onClick={() => { onSave([...selected]); onClose() }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Сохранить ({selected.size})
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Color image assigner ──────────────────────────────────────────────────────
function ColorImageSection({
  colors,
  productId,
  productImages,
  colorImages,
  onColorImagesChange,
}: {
  colors: string[]
  productId: string
  productImages: string[]
  colorImages: Record<string, string[]>
  onColorImagesChange: (colorValue: string, imgs: string[]) => void
}) {
  const [activeColor, setActiveColor] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  function handleSave(colorValue: string, imgs: string[]) {
    onColorImagesChange(colorValue, imgs)
    startTransition(async () => {
      await saveColorImagesAction(productId, colorValue, imgs)
    })
  }

  return (
    <div className="px-5 py-4 bg-blue-50/30 border-b border-gray-100">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Фото по цвету
      </p>
      <div className="space-y-1.5">
        {colors.map((color) => {
          const imgs = colorImages[color] ?? []
          return (
            <div
              key={color}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-gray-100 hover:border-blue-200 transition-colors group"
            >
              {/* Color name */}
              <span className="text-sm text-gray-700 min-w-0 flex-1 truncate">{color}</span>

              {/* Assigned thumbnails */}
              <div className="flex items-center gap-1 shrink-0">
                {imgs.length === 0 ? (
                  <span className="text-xs text-gray-300 italic">нет фото</span>
                ) : (
                  imgs.slice(0, 5).map((img, i) => (
                    <div key={i} className="w-7 h-7 rounded-md overflow-hidden border border-gray-200 bg-gray-50 shrink-0">
                      <Image src={img} alt="" width={28} height={28} className="w-full h-full object-contain" />
                    </div>
                  ))
                )}
                {imgs.length > 5 && (
                  <span className="text-xs text-gray-400 ml-0.5">+{imgs.length - 5}</span>
                )}
              </div>

              {/* Assign button */}
              <button
                type="button"
                onClick={() => setActiveColor(color)}
                className={`shrink-0 px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                  imgs.length > 0
                    ? "border-blue-200 text-blue-600 hover:bg-blue-50"
                    : "border-gray-200 text-gray-500 hover:border-blue-200 hover:text-blue-600"
                }`}
              >
                {imgs.length > 0 ? `${imgs.length} фото` : "+ Добавить"}
              </button>
            </div>
          )
        })}
      </div>

      {activeColor && (
        <MultiImagePickerModal
          title={activeColor}
          productImages={productImages}
          selectedImages={colorImages[activeColor] ?? []}
          onSave={(imgs) => handleSave(activeColor, imgs)}
          onClose={() => setActiveColor(null)}
        />
      )}
    </div>
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

// ── Image picker modal ────────────────────────────────────────────────────────
function ImagePickerModal({
  variantName,
  productImages,
  currentImage,
  onSelect,
  onClose,
}: {
  variantName: string
  productImages: string[]
  currentImage: string | null
  onSelect: (img: string | null) => void
  onClose: () => void
}) {
  const [selected, setSelected] = useState<string | null>(currentImage)

  function toggle(img: string) {
    setSelected((prev) => (prev === img ? null : img))
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900 text-sm truncate pr-4">{variantName}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors shrink-0"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Image grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {productImages.length === 0 ? (
            <div className="text-center text-sm text-gray-400 py-10">
              <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p>У товара нет фотографий.</p>
              <p className="text-xs mt-1">Добавьте фото в карточке товара.</p>
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-3">
              {productImages.map((img) => {
                const isSelected = selected === img
                return (
                  <button
                    key={img}
                    type="button"
                    onClick={() => toggle(img)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-gray-50 ${
                      isSelected
                        ? "border-blue-500 shadow-sm"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="120px" className="object-contain p-1" />
                    {isSelected && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center shadow">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100">
          <div>
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="text-sm text-red-400 hover:text-red-600 transition-colors"
              >
                Убрать фото варианта
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="button"
              onClick={() => { onSelect(selected); onClose() }}
              className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Сохранить
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Single variant row ────────────────────────────────────────────────────────
function VariantRow({ variant, productId, productImages, colorImages, onDelete }: {
  variant: Variant
  productId: string
  productImages: string[]
  colorImages: Record<string, string[]>
  onDelete: (id: string) => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [, startTransition] = useTransition()
  const [localData, setLocalData] = useState({
    price: variant.price,
    stock: variant.stock,
    sku: variant.sku,
    image: variant.image,
  })

  const thumbSrc = localData.image || productImages[0]

  let colorValue: string | null = null
  try {
    const opts = JSON.parse(variant.value) as Record<string, string>
    colorValue = opts["Цвет"] ?? null
  } catch {}
  const assignedColorImgs = colorValue ? (colorImages[colorValue] ?? []) : []

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
        {/* Thumbnail — click to open image picker */}
        <td className="px-3 py-2.5">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 shrink-0 hover:border-blue-400 transition-colors relative group/thumb"
            title="Назначить фото"
          >
            {thumbSrc ? (
              <Image src={thumbSrc} alt={variant.name} width={40} height={40} className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="h-4 w-4 text-gray-300" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover/thumb:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
              <Pencil className="h-3 w-3 text-white opacity-0 group-hover/thumb:opacity-100 transition-opacity" />
            </div>
          </button>
        </td>

        {/* Name */}
        <td className="px-3 py-2.5">
          <p className="text-sm text-gray-800 font-medium line-clamp-1">{variant.name}</p>
          {localData.sku && <p className="text-xs text-gray-400 font-mono">{localData.sku}</p>}
          {assignedColorImgs.length > 0 && (
            <div className="flex items-center gap-0.5 mt-1">
              {assignedColorImgs.slice(0, 5).map((img, i) => (
                <div key={i} className="w-5 h-5 rounded overflow-hidden border border-gray-100 bg-gray-50 shrink-0">
                  <Image src={img} alt="" width={20} height={20} className="w-full h-full object-contain" />
                </div>
              ))}
              {assignedColorImgs.length > 5 && (
                <span className="text-xs text-gray-400 ml-0.5">+{assignedColorImgs.length - 5}</span>
              )}
            </div>
          )}
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

        {/* Delete */}
        <td className="px-3 py-2.5 w-10">
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Удалить вариант"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </td>
      </tr>

      {/* Image picker modal — renders into document.body via portal */}
      {modalOpen && (
        <ImagePickerModal
          variantName={variant.name}
          productImages={productImages}
          currentImage={localData.image}
          onSelect={(img) => save("image", img ?? "")}
          onClose={() => setModalOpen(false)}
        />
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
  initialColorImages = {},
}: {
  variants: Variant[]
  productId: string
  productImages: string[]
  basePrice: number
  initialColorImages?: Record<string, string[]>
}) {
  const [variants, setVariants] = useState(initialVariants)
  const [colorImages, setColorImages] = useState(initialColorImages)
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

      {/* Color image section — shown when Цвет property exists */}
      {optionGroups.some((g) => g.name === "Цвет") && (
        <ColorImageSection
          colors={optionGroups.find((g) => g.name === "Цвет")!.values}
          productId={productId}
          productImages={productImages}
          colorImages={colorImages}
          onColorImagesChange={(colorValue, imgs) =>
            setColorImages((prev) => ({ ...prev, [colorValue]: imgs }))
          }
        />
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
                colorImages={colorImages}
                onDelete={handleVariantDelete}
              />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
