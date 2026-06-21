import { cookies } from "next/headers"
import { verifyCustomerToken } from "./customer-jwt"
import { db } from "./db"

export async function getCustomerSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get("customer_token")?.value
  if (!token) return null
  const payload = await verifyCustomerToken(token)
  if (!payload) return null
  return db.customer.findUnique({
    where: { id: payload.customerId },
    include: { bonusCard: true },
  })
}
