import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { db } from "@/lib/db"
import { BonusCard } from "@/components/account/bonus-card"
import { Tier, TIER_LABELS } from "@/lib/bonus"
import { TrendingUp, TrendingDown, Wallet, Gift, Star } from "lucide-react"

const TX_ICONS: Record<string, string> = {
  earn: "💰", spend: "🛒", birthday: "🎂", admin: "⚡", expire: "⏳",
}

export default async function StoreAccountPage() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")

  const [transactions, notifs, ordersCount] = await Promise.all([
    db.bonusTransaction.findMany({
      where: { customerId: customer.id },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.customerNotification.findMany({
      where: { customerId: customer.id, isRead: false },
      orderBy: { sentAt: "desc" },
      take: 3,
    }),
    db.order.count({ where: { customerEmail: customer.email } }),
  ])

  const card = customer.bonusCard

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Мой кабинет</h1>

      {card && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-5">Бонусная карта</h2>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="w-full max-w-sm">
              <BonusCard
                cardNumber={card.cardNumber}
                firstName={customer.firstName}
                lastName={customer.lastName}
                balance={card.balance}
                totalEarned={card.totalEarned}
                tier={card.tier as Tier}
              />
            </div>
            <div className="flex-1 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <TrendingUp className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900">{card.totalEarned.toLocaleString("ru")}</p>
                <p className="text-xs text-gray-400 mt-1">Накоплено всего</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl">
                <TrendingDown className="h-5 w-5 text-red-400 mx-auto mb-2" />
                <p className="text-2xl font-black text-gray-900">{card.totalSpent.toLocaleString("ru")}</p>
                <p className="text-xs text-gray-400 mt-1">Потрачено</p>
              </div>
              <div className="text-center p-4 bg-[#fff3ee] rounded-xl border border-[#F26522]/10">
                <Wallet className="h-5 w-5 text-[#F26522] mx-auto mb-2" />
                <p className="text-2xl font-black text-[#F26522]">{card.balance.toLocaleString("ru")}</p>
                <p className="text-xs text-gray-400 mt-1">Текущий баланс</p>
              </div>
              <div className="col-span-3 text-center p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500">
                  <Star className="inline h-3.5 w-3.5 text-[#F26522] mr-1" />
                  Уровень <strong>{TIER_LABELS[card.tier as Tier]}</strong> ·{" "}
                  {ordersCount} {ordersCount === 1 ? "заказ" : ordersCount < 5 ? "заказа" : "заказов"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Последние операции</h2>
          <div className="space-y-3">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{TX_ICONS[tx.type] ?? "●"}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{tx.description}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(tx.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${tx.amount > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString("ru")} ₽
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {notifs.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Новые уведомления</h2>
          <div className="space-y-3">
            {notifs.map(n => (
              <div key={n.id} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
                <Gift className="h-4 w-4 text-[#F26522] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
