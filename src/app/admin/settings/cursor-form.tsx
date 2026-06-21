"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { saveCursorConfig } from "./cursor-actions"
import type { CursorConfig } from "@/lib/cursor-config"

export function CursorForm({ initial }: { initial: CursorConfig }) {
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const [enabled,     setEnabled]     = useState(initial.enabled)
  const [color,       setColor]       = useState(initial.color)
  const [size,        setSize]        = useState(initial.size)
  const [blendMode,   setBlendMode]   = useState<"difference" | "normal">(initial.blendMode)
  const [ringEnabled, setRingEnabled] = useState(initial.ringEnabled)

  function handleSave() {
    startTransition(async () => {
      await saveCursorConfig({ enabled, color, size, blendMode, ringEnabled })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">Кастомный курсор</h2>
        {/* Preview */}
        <div className="flex items-center gap-3">
          <div
            className="rounded-full border"
            style={{
              width: size * 3.6,
              height: size * 3.6,
              borderColor: color,
              opacity: ringEnabled ? 0.4 : 0,
            }}
          />
          <div
            className="rounded-full"
            style={{ width: size, height: size, background: color }}
          />
          <span className="text-xs text-gray-400">предпросмотр</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setEnabled(!enabled)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            enabled ? "bg-gray-900" : "bg-gray-200"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              enabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
        <Label>{enabled ? "Включён" : "Выключен"}</Label>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Цвет</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-9 w-12 cursor-pointer rounded border border-gray-300"
            />
            <Input value={color} onChange={e => setColor(e.target.value)} className="font-mono" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Размер точки: {size}px</Label>
          <input
            type="range"
            min={6}
            max={24}
            value={size}
            onChange={e => setSize(Number(e.target.value))}
            className="w-full accent-gray-900"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Режим наложения</Label>
          <div className="flex gap-2">
            {(["difference", "normal"] as const).map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => setBlendMode(mode)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  blendMode === mode
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
              >
                {mode === "difference" ? "Инверсия" : "Обычный"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Кольцо (инертное)</Label>
          <div className="flex items-center gap-3 mt-1">
            <button
              type="button"
              onClick={() => setRingEnabled(!ringEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                ringEnabled ? "bg-gray-900" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  ringEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm text-gray-500">{ringEnabled ? "Показывать" : "Скрыть"}</span>
          </div>
        </div>
      </div>

      {saved && (
        <p className="rounded-md bg-green-50 px-4 py-2.5 text-sm text-green-700 font-medium">
          ✓ Настройки курсора сохранены
        </p>
      )}

      <Button type="button" onClick={handleSave} disabled={isPending}>
        {isPending ? "Сохранение..." : "Сохранить"}
      </Button>
    </section>
  )
}
