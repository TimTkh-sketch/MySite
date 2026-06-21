import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { db } from "@/lib/db"

const TX_ICONS: Record<string, string> = {
  earn: "💰", spend: "🛒", birthday: "🎂", admin: "⚡", expire: "⏳",
}
const TX_LABELS: Record<string, string> = {
  earn: "Начисление", spend: "Списание", birthday: "День рождения",
  admin: "Ручная корректировка", expire: "Истечение срока",
}

function fmt(d: Date | string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })
}

export default async function BonusPage() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")

  const transactions = await db.bonusTransaction.findMany({
    where: { customerId: customer.id },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">История баллов</h1>
        <div className="flex items-center gap-2 px-4 py-2 bg-[#fff3ee] rounded-xl">
          <span className="text-sm font-medium text-gray-500">Баланс:</span>
          <span className="text-lg font-black text-[#F26522]">
            {(customer.bonusCard?.balance ?? 0).toLocaleString("ru")} ₽
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-sm">История операций пуста</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {["Дата", "Тип", "Описание", "Сумма"].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3 text-gray-500 whitespace-nowrap">{fmt(tx.createdAt)}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5">
                      <span>{TX_ICONS[tx.type] ?? "●"}</span>
                      <span className="text-gray-600">{TX_LABELS[tx.type] ?? tx.type}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-800">{tx.description}</td>
                  <td className="px-5 py-3">
                    <span className={`font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")} ₽
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
