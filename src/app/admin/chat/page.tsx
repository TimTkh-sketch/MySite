import { db } from "@/lib/db"
import { ChatAdmin } from "./chat-admin"

export default async function ChatAdminPage() {
  const store = await db.store.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true, slug: true },
  })

  if (!store) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-400">
        <p>Магазин не найден</p>
      </div>
    )
  }

  const [settings, operators] = await Promise.all([
    db.chatSettings.findUnique({ where: { storeId: store.id } }),
    db.chatOperator.findMany({ where: { storeId: store.id } }),
  ])

  const quickReplies = settings?.quickReplies?.length
    ? settings.quickReplies
    : ["Здравствуйте!", "Одну минуту, пожалуйста", "Уточните, пожалуйста"]

  return (
    <div className="flex flex-col gap-4" style={{ height: "calc(100vh - 72px)" }}>
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Онлайн-чат</h1>
        <a
          href={`/store/${store.slug}`}
          target="_blank"
          className="text-xs text-blue-600 hover:underline"
        >
          Открыть витрину →
        </a>
      </div>
      <ChatAdmin
        storeId={store.id}
        quickReplies={quickReplies}
        operators={operators}
      />
    </div>
  )
}
