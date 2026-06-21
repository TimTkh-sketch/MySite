import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { ProfileForm } from "@/app/account/profile/profile-form"

export default async function StoreProfilePage() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
      <ProfileForm customer={customer} />
    </div>
  )
}
