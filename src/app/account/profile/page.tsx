import { redirect } from "next/navigation"
import { getCustomerSession } from "@/lib/get-customer-session"
import { ProfileForm } from "./profile-form"

export default async function ProfilePage() {
  const customer = await getCustomerSession()
  if (!customer) redirect("/customer/login")
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Профиль</h1>
      <ProfileForm customer={customer} />
    </div>
  )
}
