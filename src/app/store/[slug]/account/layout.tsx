import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { db } from "@/lib/db"
import { AccountNav } from "@/components/account/account-nav"

export default async function StoreAccountLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const customer = await getCustomerSession()
  if (!customer) redirect(`/customer/login`)

  const unreadCount = await db.customerNotification.count({
    where: { customerId: customer.id, isRead: false },
  })

  const base = `/store/${slug}/account`

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex gap-6">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-24">
            <div className="mb-4 pb-3 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-medium">Привет,</p>
              <p className="text-sm font-bold text-gray-900 truncate">{customer.firstName} {customer.lastName}</p>
              <p className="text-xs text-gray-400 mt-0.5 truncate">{customer.email}</p>
            </div>
            <AccountNav base={base} logoutRedirect={`/store/${slug}`} unreadCount={unreadCount} />
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 px-2 py-2 flex justify-around">
          <AccountNav base={base} logoutRedirect={`/store/${slug}`} unreadCount={unreadCount} />
        </div>

        {/* Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">{children}</main>
      </div>
    </div>
  )
}
