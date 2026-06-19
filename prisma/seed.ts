import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter } as never)

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await db.user.upsert({
    where: { email: "admin@myshop.ru" },
    update: {},
    create: {
      email: "admin@myshop.ru",
      name: "Super Admin",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  })

  console.log("Admin created:", admin.email)

  const store = await db.store.upsert({
    where: { slug: "gadget-market" },
    update: {},
    create: {
      name: "Гаджет Маркет",
      slug: "gadget-market",
      description: "Самый дружелюбный магазин гаджетов",
      primaryColor: "#1a1a1a",
      accentColor: "#e53e3e",
      settings: {
        create: {
          phone: "+7 (342) 215-43-44",
          address: "ул. М.Горького, 64/1, Пермь",
          workingHours: "Ежедневно 10:00-21:00",
          freeShippingFrom: 5000,
        },
      },
    },
  })

  console.log("Store created:", store.name)

  const categories = [
    { name: "Смартфоны", slug: "smartfony" },
    { name: "Аксессуары", slug: "aksessuary" },
    { name: "Ноутбуки", slug: "noutbuki" },
    { name: "Наушники", slug: "naushniki" },
    { name: "Умные часы", slug: "umnye-chasy" },
  ]

  for (const cat of categories) {
    await db.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: cat.slug } },
      update: {},
      create: { ...cat, storeId: store.id },
    })
  }

  console.log("Categories created")
  console.log("\nLogin: admin@myshop.ru / admin123")
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect())
