"use client"

import { useState } from "react"
import { Bell, Gift, ShoppingBag, Star, Megaphone } from "lucide-react"
import { cn } from "@/lib/utils"

interface Notification {
  id: string; type: string; title: string; message: string; isRead: boolean; sentAt: Date | string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  birthday: <span className="text-lg">🎂</span>,
  order:    <ShoppingBag className="h-4 w-4 text-blue-500" />,
  promo:    <Star className="h-4 w-4 text-amber-500" />,
  manual:   <Megaphone className="h-4 w-4 text-purple-500" />,
}

export function NotificationsList({ notifications }: { notifications: Notification[] }) {
  const [items, setItems] = useState(notifications)

  async function markRead(id: string) {
    await fetch(`/api/customer/notifications/${id}/read`, { method: "PATCH" })
    setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
        <Bell className="h-10 w-10 text-gray-200 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Уведомлений нет</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map(n => (
        <div
          key={n.id}
          onClick={() => !n.isRead && markRead(n.id)}
          className={cn(
            "bg-white rounded-2xl p-5 shadow-sm border transition-all cursor-pointer",
            n.isRead ? "border-gray-100 opacity-70" : "border-[#F26522]/20 bg-[#fff9f6]"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
              {TYPE_ICONS[n.type] ?? <Bell className="h-4 w-4 text-gray-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className={cn("text-sm font-semibold", n.isRead ? "text-gray-600" : "text-gray-900")}>
                  {n.title}
                </p>
                {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#F26522] shrink-0" />}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1.5">
                {new Date(n.sentAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
