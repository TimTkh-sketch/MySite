import { db } from "./db"
import { getBirthdayBonus, getTier } from "./bonus"

export async function processBirthdays() {
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()

  const all = await db.customer.findMany({
    where: { birthDate: { not: null } },
    include: { bonusCard: true },
  })

  const birthdayCustomers = all.filter(c => {
    if (!c.birthDate) return false
    const bd = new Date(c.birthDate)
    return bd.getMonth() + 1 === month && bd.getDate() === day
  })

  for (const customer of birthdayCustomers) {
    const tier = getTier(customer.bonusCard?.totalEarned ?? 0)
    const bonus = getBirthdayBonus(tier as Parameters<typeof getBirthdayBonus>[0])

    await db.bonusTransaction.create({
      data: {
        customerId: customer.id,
        type: "birthday",
        amount: bonus,
        description: `Подарок на День рождения 🎂 (${bonus} баллов)`,
      },
    })

    if (customer.bonusCard) {
      await db.bonusCard.update({
        where: { customerId: customer.id },
        data: {
          balance:     { increment: bonus },
          totalEarned: { increment: bonus },
        },
      })
    }

    await db.customerNotification.create({
      data: {
        customerId: customer.id,
        type: "birthday",
        title: `С Днём рождения, ${customer.firstName}! 🎉`,
        message: `Мы дарим вам ${bonus} бонусных баллов в честь вашего праздника. Используйте их при следующей покупке!`,
      },
    })
  }

  return birthdayCustomers.length
}
