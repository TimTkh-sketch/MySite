"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  GripVertical, Pencil, ChevronDown, ChevronRight, Eye, EyeOff,
} from "lucide-react"
import { toggleCategoryActive, reorderCategories } from "@/app/admin/categories/actions"
import { DeleteCategoryButton } from "./delete-category-button"

interface Category {
  id: string
  name: string
  parentId: string | null
  isActive: boolean
  sortOrder: number
  _count: { products: number; children: number }
}

function CategoryRow({
  cat,
  depth,
  childRows,
}: {
  cat: Category
  depth: number
  childRows?: React.ReactNode
}) {
  const [expanded, setExpanded] = useState(depth === 0)
  const [active, setActive] = useState(cat.isActive)
  const [pending, setPending] = useState(false)
  const hasChildren = cat._count.children > 0

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: cat.id })

  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setPending(true)
    const next = !active
    setActive(next)
    await toggleCategoryActive(cat.id, next)
    setPending(false)
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`flex items-center gap-1.5 py-2 rounded-lg hover:bg-gray-50 group transition-colors ${!active ? "opacity-55" : ""}`}
        style={{ paddingLeft: `${8 + depth * 20}px`, paddingRight: "8px" }}
      >
        {/* Drag handle */}
        <button
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0 touch-none p-0.5"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Expand toggle */}
        {hasChildren ? (
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-700 shrink-0 p-0.5">
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="w-5 h-4 shrink-0" />
        )}

        {/* Name */}
        <span className={`text-sm flex-1 min-w-0 truncate ${depth === 0 ? "font-semibold text-gray-900" : "text-gray-700"}`}>
          {cat.name}
        </span>

        {/* Counters */}
        <div className="flex items-center gap-1.5 shrink-0">
          {cat._count.products > 0 && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              {cat._count.products}
            </span>
          )}
          {!active && (
            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">скрыта</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={handleToggle}
            disabled={pending}
            title={active ? "Скрыть категорию" : "Показать категорию"}
            className={`p-1.5 rounded-md transition-colors ${
              active ? "text-green-500 hover:bg-green-50" : "text-gray-400 hover:bg-gray-100"
            }`}
          >
            {active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          </button>
          <Link href={`/admin/categories/${cat.id}`}>
            <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </Link>
          <DeleteCategoryButton id={cat.id} />
        </div>
      </div>

      {hasChildren && expanded && <div>{childRows}</div>}
    </div>
  )
}

function SortableLevel({
  categories,
  depth,
  allCategories,
}: {
  categories: Category[]
  depth: number
  allCategories: Category[]
}) {
  const [items, setItems] = useState(categories)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const childrenOf = (id: string) =>
    allCategories.filter((c) => c.parentId === id).sort((a, b) => a.sortOrder - b.sortOrder)

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
        {items.map((cat) => {
          const children = childrenOf(cat.id)
          return (
            <CategoryRow
              key={cat.id}
              cat={cat}
              depth={depth}
              childRows={children.length > 0 ? (
                <SortableLevel categories={children} depth={depth + 1} allCategories={allCategories} />
              ) : undefined}
            />
          )
        })}
      </div>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        {items.map((cat) => {
          const children = childrenOf(cat.id)
          return (
            <CategoryRow
              key={cat.id}
              cat={cat}
              depth={depth}
              childRows={children.length > 0 ? (
                <SortableLevel categories={children} depth={depth + 1} allCategories={allCategories} />
              ) : undefined}
            />
          )
        })}
      </SortableContext>
    </DndContext>
  )
}

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const roots = categories
    .filter((c) => !c.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3">
      <SortableLevel categories={roots} depth={0} allCategories={categories} />
    </div>
  )
}
