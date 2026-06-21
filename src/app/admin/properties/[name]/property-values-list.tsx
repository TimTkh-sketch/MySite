"use client"

import { useState, useTransition } from "react"
import { GripVertical, Pencil, X, Check, Plus, Search } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  addPropertyValue,
  deletePropertyValue,
  updatePropertyValue,
  reorderPropertyValues,
} from "../actions"

interface Value {
  id: string
  value: string
  sortOrder: number
}

function ValueRow({
  item,
  property,
  onDelete,
  onUpdate,
}: {
  item: Value
  property: string
  onDelete: (id: string) => void
  onUpdate: (id: string, value: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(item.value)
  const [, startTransition] = useTransition()

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  function commitEdit() {
    if (draft.trim() && draft.trim() !== item.value) {
      startTransition(async () => {
        await updatePropertyValue(item.id, draft.trim(), property)
        onUpdate(item.id, draft.trim())
      })
    } else {
      setDraft(item.value)
    }
    setEditing(false)
  }

  function handleDelete() {
    if (!confirm(`Удалить «${item.value}»?`)) return
    startTransition(async () => {
      await deletePropertyValue(item.id, property)
      onDelete(item.id)
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 last:border-0 bg-white hover:bg-gray-50 transition-colors group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors shrink-0 touch-none"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Value */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitEdit()
              if (e.key === "Escape") { setDraft(item.value); setEditing(false) }
            }}
            className="w-full text-sm px-2 py-0.5 border border-orange-400 rounded-lg outline-none ring-2 ring-orange-100"
          />
        ) : (
          <span className="text-sm text-gray-800">{item.value}</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {editing ? (
          <button
            onClick={commitEdit}
            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-blue-500 hover:bg-blue-50 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export function PropertyValuesList({
  property,
  storeId,
  initialValues,
}: {
  property: string
  storeId: string
  initialValues: Value[]
}) {
  const [values, setValues] = useState(initialValues)
  const [newValue, setNewValue] = useState("")
  const [search, setSearch] = useState("")
  const [, startTransition] = useTransition()

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const filtered = search.trim()
    ? values.filter((v) => v.value.toLowerCase().includes(search.toLowerCase()))
    : values

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = values.findIndex((v) => v.id === active.id)
    const newIndex = values.findIndex((v) => v.id === over.id)
    const newOrder = arrayMove(values, oldIndex, newIndex)
    setValues(newOrder)
    startTransition(async () => {
      await reorderPropertyValues(newOrder.map((v) => v.id), property)
    })
  }

  function handleAdd() {
    const trimmed = newValue.trim()
    if (!trimmed) return
    setNewValue("")
    startTransition(async () => {
      await addPropertyValue(storeId, property, trimmed)
      setValues((prev) => [...prev, { id: crypto.randomUUID(), value: trimmed, sortOrder: prev.length }])
    })
  }

  function handleDelete(id: string) {
    setValues((prev) => prev.filter((v) => v.id !== id))
  }

  function handleUpdate(id: string, value: string) {
    setValues((prev) => prev.map((v) => v.id === id ? { ...v, value } : v))
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gray-50/40">
        <button
          onClick={handleAdd}
          disabled={!newValue.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Plus className="h-3.5 w-3.5" />
          Добавить
        </button>

        <input
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") handleAdd() }}
          placeholder={`Новое значение для «${property}»`}
          className="flex-1 text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
        />

        <div className="relative shrink-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Найти"
            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 w-36"
          />
        </div>
      </div>

      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-gray-100 bg-gray-50">
        <div className="w-4 shrink-0" />
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide flex-1">
          Значение свойства
        </span>
      </div>

      {/* Values list */}
      {filtered.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          {search ? "Ничего не найдено" : "Нет значений. Добавьте первое."}
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filtered.map((v) => v.id)} strategy={verticalListSortingStrategy}>
            {filtered.map((item) => (
              <ValueRow
                key={item.id}
                item={item}
                property={property}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}
          </SortableContext>
        </DndContext>
      )}

      <div className="px-4 py-2 border-t border-gray-100 bg-gray-50/40">
        <p className="text-xs text-gray-400">{values.length} значений</p>
      </div>
    </div>
  )
}
