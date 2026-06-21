"use client"

import { useState } from "react"
import { Plus, Trash2, Save, UserPlus, Wifi, WifiOff } from "lucide-react"

interface Operator {
  id: string
  name: string
  avatar: string | null
  isOnline: boolean
}

interface Props {
  storeId: string
  initialOperators: Operator[]
  initialSettings: { botReply: string | null; quickReplies: string[] }
}

export function ChatSettingsForm({ storeId, initialOperators, initialSettings }: Props) {
  const [operators, setOperators] = useState<Operator[]>(initialOperators)
  const [newOpName, setNewOpName] = useState("")
  const [botReply, setBotReply] = useState(
    initialSettings.botReply ??
      "Операторы сейчас недоступны. Оставьте вопрос — мы ответим в ближайшее время!"
  )
  const [quickReplies, setQuickReplies] = useState<string[]>(
    initialSettings.quickReplies.length > 0
      ? initialSettings.quickReplies
      : ["Здравствуйте!", "Одну минуту, пожалуйста", "Уточните, пожалуйста"]
  )
  const [newQR, setNewQR] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function toggleOnline(op: Operator) {
    await fetch(`/api/chat/operators/${op.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnline: !op.isOnline }),
    })
    setOperators(prev => prev.map(o => o.id === op.id ? { ...o, isOnline: !o.isOnline } : o))
  }

  async function addOperator() {
    if (!newOpName.trim()) return
    const r = await fetch("/api/chat/operators", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, name: newOpName.trim() }),
    })
    const op = await r.json()
    setOperators(prev => [...prev, op])
    setNewOpName("")
  }

  async function deleteOperator(id: string) {
    await fetch(`/api/chat/operators/${id}`, { method: "DELETE" })
    setOperators(prev => prev.filter(o => o.id !== id))
  }

  function addQuickReply() {
    if (!newQR.trim()) return
    setQuickReplies(prev => [...prev, newQR.trim()])
    setNewQR("")
  }

  function removeQuickReply(i: number) {
    setQuickReplies(prev => prev.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    await fetch("/api/chat/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, botReply, quickReplies }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Operators */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Операторы</h2>
        <div className="space-y-2 mb-4">
          {operators.length === 0 && (
            <p className="text-sm text-gray-400">Нет операторов. Добавьте ниже.</p>
          )}
          {operators.map(op => (
            <div key={op.id} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-[#F26522] flex items-center justify-center text-white text-sm font-bold shrink-0">
                {op.name[0]?.toUpperCase()}
              </div>
              <span className="flex-1 text-sm font-medium text-gray-900">{op.name}</span>
              <button
                onClick={() => toggleOnline(op)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  op.isOnline
                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {op.isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {op.isOnline ? "Онлайн" : "Офлайн"}
              </button>
              <button
                onClick={() => deleteOperator(op.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newOpName}
            onChange={e => setNewOpName(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addOperator()}
            placeholder="Имя оператора..."
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#F26522] transition-colors"
          />
          <button
            onClick={addOperator}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F26522] text-white text-sm font-medium hover:bg-[#d94f00] transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Добавить
          </button>
        </div>
      </section>

      {/* Bot reply */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Автоответ бота</h2>
        <p className="text-xs text-gray-400 mb-3">Отправляется автоматически когда все операторы офлайн</p>
        <textarea
          value={botReply}
          onChange={e => setBotReply(e.target.value)}
          rows={3}
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-gray-200 outline-none focus:border-[#F26522] transition-colors resize-none"
        />
      </section>

      {/* Quick replies */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-1">Быстрые ответы</h2>
        <p className="text-xs text-gray-400 mb-3">Кнопки в окне оператора для быстрой отправки</p>
        <div className="space-y-2 mb-3">
          {quickReplies.map((qr, i) => (
            <div key={i} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-gray-50">
              <span className="flex-1 text-sm text-gray-700">{qr}</span>
              <button
                onClick={() => removeQuickReply(i)}
                className="w-6 h-6 rounded-md flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newQR}
            onChange={e => setNewQR(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addQuickReply()}
            placeholder="Новый быстрый ответ..."
            className="flex-1 text-sm px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#F26522] transition-colors"
          />
          <button
            onClick={addQuickReply}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-100 text-gray-700 text-sm hover:bg-gray-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Добавить
          </button>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-60"
        style={{ background: saved ? "#16a34a" : "#F26522" }}
      >
        <Save className="h-4 w-4" />
        {saved ? "Сохранено!" : saving ? "Сохраняю..." : "Сохранить настройки"}
      </button>
    </div>
  )
}
