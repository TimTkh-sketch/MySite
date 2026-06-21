import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { db } from "@/lib/db"
import { AccountNav } from "@/components/account/account-nav"

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")

  const unreadCount = await db.customerNotification.count({
    where: { customerId: customer.id, isRead: false },
  })

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-56 shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-6">
              <div className="mb-4 pb-3 border-b border-gray-100">
                <p className="text-xs text-gray-400 font-medium">Привет,</p>
                <p className="text-sm font-bold text-gray-900">{customer.firstName} {customer.lastName}</p>
                <p className="text-xs text-gray-400 mt-0.5">{customer.email}</p>
              </div>
              <AccountNav unreadCount={unreadCount} />
            </div>
          </aside>

          {/* Content */}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
    </div>
  )
}
