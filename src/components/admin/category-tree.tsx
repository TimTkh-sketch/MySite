"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus, Minus } from "lucide-react"

interface Cat {
  id: string
  name: string
  slug: string
  parentId: string | null
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
  return cat.children.some(
    (c) => c.id === id || isAncestorOf(c, id)
  )
}

function TreeNode({ cat, selectedId, baseUrl, depth }: {
  cat: Cat
  selectedId?: string
  baseUrl: string
  depth: number
}) {
  const hasChildren = cat.children.length > 0
  const isSelected = cat.id === selectedId
  const isAncestor = isAncestorOf(cat, selectedId)

  // Naturally open if selected or ancestor of selected
  const naturalOpen = isSelected || isAncestor

  // User can manually toggle (override natural state)
  const [manualOpen, setManualOpen] = useState<boolean | null>(null)

  const open = manualOpen !== null ? manualOpen : naturalOpen

  function handleToggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    setManualOpen((v) => (v !== null ? !v : !naturalOpen))
  }

  return (
    <div>
      <div
        className={`flex items-center gap-1 rounded-md transition-colors ${
          isSelected ? "bg-orange-50" : "hover:bg-gray-50"
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px`, paddingRight: "8px" }}
      >
        {/* Expand/collapse button */}
        <button
          onClick={handleToggle}
          className={`shrink-0 w-4 h-4 flex items-center justify-center rounded transition-colors ${
            hasChildren ? "text-gray-400 hover:text-gray-700" : "opacity-0 pointer-events-none"
          }`}
        >
          {hasChildren && (open
            ? <Minus className="h-3 w-3" />
            : <Plus className="h-3 w-3" />
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
            <span className={`shrink-0 ml-2 text-xs tabular-nums ${isSelected ? "text-orange-400" : "text-gray-400"}`}>
              {cat._count.products}
            </span>
          )}
        </Link>
      </div>

      {hasChildren && open && (
        <div>
          {cat.children.map((child) => (
            <TreeNode
              key={child.id}
              cat={child}
              selectedId={selectedId}
              baseUrl={baseUrl}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTree({ categories, selectedId, baseUrl }: Props) {
  const totalProducts = categories.reduce(
    (s, c) => s + c._count.products + c.children.reduce((ss, cc) => ss + cc._count.products, 0),
    0
  )

  return (
    <div className="w-56 shrink-0 bg-white rounded-xl border border-gray-200 overflow-hidden self-start sticky top-4">
      <div className="px-3 py-2.5 border-b border-gray-100 bg-gray-50">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Каталог</p>
      </div>

      <div className="py-1.5 overflow-y-auto max-h-[calc(100vh-200px)]">
        <Link
          href={baseUrl}
          className={`flex items-center justify-between px-3 py-1.5 text-sm rounded-md mx-1 transition-colors ${
            !selectedId ? "bg-orange-50 text-orange-600 font-semibold" : "text-gray-700 hover:bg-gray-50"
          }`}
        >
          <span>Все товары</span>
          <span className="text-xs text-gray-400 tabular-nums">{totalProducts}</span>
        </Link>

        <div className="mt-1">
          {categories.map((cat) => (
            <TreeNode
              key={cat.id}
              cat={cat}
              selectedId={selectedId}
              baseUrl={baseUrl}
              depth={0}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
