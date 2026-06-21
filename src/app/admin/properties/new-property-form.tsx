"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { createProperty } from "./actions"

export function NewPropertyForm({ storeId }: { storeId: string }) {
  const [name, setName] = useState("")
  const [valuesText, setValuesText] = useState("")
  const [, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    const trimName = name.trim()
    const values = valuesText.split(",").map((v) => v.trim()).filter(Boolean)
    if (!trimName) return
    startTransition(async () => {
      await createProperty(storeId, trimName, values)
      router.push(`/admin/properties/${encodeURIComponent(trimName)}`)
    })
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      <p className="text-sm font-semibold text-gray-900">Создать свойство</p>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Название свойства</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Цвет"
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400"
          />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">Значения (через запятую)</label>
          <textarea
            value={valuesText}
            onChange={(e) => setValuesText(e.target.value)}
            placeholder="Silver (серебристый), Space Black (черный), Gold (золотой)"
            rows={3}
            className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-400 resize-none"
          />
        </div>
      </div>
      <button
        onClick={handleSave}
        disabled={!name.trim()}
        className="w-full py-2 text-sm font-medium bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Создать свойство
      </button>
    </div>
  )
}
