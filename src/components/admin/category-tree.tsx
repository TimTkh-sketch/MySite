"use client"

import { useState, useEffect, useTransition } from "react"
import Link from "next/link"
import { Eye, EyeOff, GripVertical, ChevronDown, ChevronRight } from "lucide-react"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { toggleCategoryActive, reorderCategories } from "@/app/admin/categories/actions"

interface Cat {
  id: string
  name: string
  slug: string
  parentId: string | null
  isActive: boolean
  sortOrder: number
  _count: { products: number }
  children: Cat[]
}

interface Props {
  categories: Cat[]
  selectedId?: string
  baseUrl: string
}

function isAncestorOf(cat: Cat, id?: string): boolean {
  if (!id) return false
  return cat.children.some((c) => c.id === id || isAncestorOf(c, id))
}

function TreeNode({
  cat,
  selectedId,
  baseUrl,
  depth,
}: {
  cat: Cat
  selectedId?: string
  baseUrl: string
  depth: number
}) {
  const isSelected = cat.id === selectedId
  const naturalOpen = isSelected || isAncestorOf(cat, selectedId)
  const [open, setOpen] = useState(naturalOpen)
  const [active, setActive] = useState(cat.isActive)
  const [, startTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  }

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    const next = !active
    setActive(next)
    startTransition(async () => {
      await toggleCategoryActive(cat.id, next)
    })
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-0.5 rounded-md transition-colors group ${
          isSelected ? "bg-orange-50" : "hover:bg-gray-50"
        } ${!active ? "opacity-50" : ""}`}
        style={{ paddingLeft: `${depth * 14 + 2}px`, paddingRight: "2px" }}
      >
        {/* Drag handle */}
        <button
          className="shrink-0 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Expand toggle */}
        <button
          onClick={() => setOpen((v) => !v)}
          className={`shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors ${
            cat.children.length > 0
              ? "text-gray-400 hover:text-gray-700"
              : "opacity-0 pointer-events-none"
          }`}
        >
          {cat.children.length > 0 && (
            open
              ? <ChevronDown className="h-3 w-3" />
              : <ChevronRight className="h-3 w-3" />
          )}
        </button>

        {/* Category link */}
        <Link
          href={`${baseUrl}?category=${cat.id}`}
          className={`flex-1 flex items-center justify-between py-1.5 text-sm min-w-0 ${
            isSelected ? "text-orange-600 font-semibold" : "text-gray-700"
          }`}
        >
          <span className="truncate">{cat.name}</span>
          {cat._count.products > 0 && (
            <span className={`shrink-0 ml-1 text-xs tabular-nums ${isSelected ? "text-orange-400" : "text-gray-400"}`}>
              {cat._count.products}
            </span>
          )}
        </Link>

        {/* Eye toggle */}
        <button
          onClick={handleToggle}
          className={`shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity ${
            active
              ? "text-gray-300 hover:text-gray-600"
              : "text-orange-400 hover:text-orange-600 opacity-100"
          }`}
          title={active ? "Скрыть категорию" : "Показать категорию"}
        >
          {active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Children level */}
      {cat.children.length > 0 && open && (
        <SortableChildLevel
          categories={cat.children}
          selectedId={selectedId}
          baseUrl={baseUrl}
          depth={depth + 1}
        />
      )}
    </div>
  )
}

function SortableChildLevel({
  categories,
  selectedId,
  baseUrl,
  depth,
}: {
  categories: Cat[]
  selectedId?: string
  baseUrl: string
  depth: number
}) {
  const [items, setItems] = useState(categories)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex((c) => c.id === active.id)
    const newIdx = items.findIndex((c) => c.id === over.id)
    const next = arrayMove(items, oldIdx, newIdx)
    setItems(next)
    await reorderCategories(next.map((c, i) => ({ id: c.id, sortOrder: i })))
  }

  if (!mounted) {
    return (
      <div>
        {items.map((cat) => (
          <TreeNode key={cat.id} cat={cat} selectedId={selectedId} baseUrl={baseUrl} depth={depth} />
        ))}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {items.map((cat) => (
          <TreeNode key={cat.id} cat={cat} selectedId={selectedId} baseUrl={baseUrl} depth={depth} />
        ))}
      </SortableContext>
    </DndContext>
  )
}

export function CategoryTree({ categories, selectedId, baseUrl }: Props) {
  const totalProducts = categories.reduce(
    (s, c) =>
      s +
      c._count.products +
      c.children.reduce(
        (ss, cc) =>
          ss + cc._count.products + cc.children.reduce((sss, ccc) => sss + ccc._count.products, 0),
        0
      ),
    0
  )

  return (
    <div className="w-60 shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden self-start sticky top-4">
      <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Каталог</p>
        <p className="text-xs text-gray-400 mt-0.5">⠿ порядок · 👁 видимость</p>
      </div>

      <div className="py-1.5 overflow-y-auto max-h-[calc(100vh-200px)]">
        <Link
          href={baseUrl}
          className={`flex items-center justify-between px-3 py-1.5 text-sm rounded-md mx-1 transition-colors ${
            !selectedId
              ? "bg-orange-50 text-orange-600 font-semibold"
              : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>Все товары</span>
          <span className="text-xs text-gray-400 tabular-nums">{totalProducts}</span>
        </Link>

        <div className="mt-1">
          <SortableChildLevel
            categories={categories}
            selectedId={selectedId}
            baseUrl={baseUrl}
            depth={0}
          />
        </div>
      </div>
    </div>
  )
}
