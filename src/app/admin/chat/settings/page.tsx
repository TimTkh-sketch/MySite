import { db } from "@/lib/db"
import { ChatSettingsForm } from "./chat-settings-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default async function ChatSettingsPage() {
  const store = await db.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  })

  if (!store) return <p className="text-gray-400">Магазин не найден</p>

  const [operators, settings] = await Promise.all([
    db.chatOperator.findMany({ where: { storeId: store.id } }),
    db.chatSettings.findUnique({ where: { storeId: store.id } }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/chat"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к чатам
        </Link>
      </div>
      <h1 className="text-xl font-bold text-gray-900">Настройки чата</h1>
      <ChatSettingsForm
        storeId={store.id}
        initialOperators={operators}
        initialSettings={{
          botReply: settings?.botReply ?? null,
          quickReplies: settings?.quickReplies ?? [],
        }}
      />
    </div>
  )
}
