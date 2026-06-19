import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"
import "dotenv/config"

const adapter = new PrismaPg(process.env.DATABASE_URL!)
const db = new PrismaClient({ adapter } as never)

async function main() {
  // ─── Admin user ───────────────────────────────────────────────────────────
  const hashedPassword = await bcrypt.hash("admin123", 10)
  const admin = await db.user.upsert({
    where: { email: "admin@myshop.ru" },
    update: {},
    create: {
      email: "admin@myshop.ru",
      name: "Администратор",
      password: hashedPassword,
      role: "SUPER_ADMIN",
    },
  })
  console.log("✓ Admin:", admin.email)

  // ─── Store ────────────────────────────────────────────────────────────────
  const store = await db.store.upsert({
    where: { slug: "gadget-market" },
    update: {
      primaryColor: "#1a1a1a",
      accentColor: "#FF6B35",
    },
    create: {
      name: "Гаджет Маркет",
      slug: "gadget-market",
      description: "Самый дружелюбный магазин гаджетов. Работаем с 2012 года.",
      logo: "https://static.insales-cdn.com/assets/1/412/3154332/1779369297/logo.png",
      primaryColor: "#1a1a1a",
      accentColor: "#FF6B35",
      settings: {
        create: {
          phone: "+7 (342) 215-43-44",
          address: "г. Пермь, ул. М.Горького, 64/1",
          workingHours: "Ежедневно 10:00-21:00",
          freeShippingFrom: 5000,
          shippingCost: 300,
        },
      },
    },
  })
  console.log("✓ Store:", store.name)

  // ─── Banners ──────────────────────────────────────────────────────────────
  await db.banner.deleteMany({ where: { storeId: store.id } })
  await db.banner.createMany({
    data: [
      {
        storeId: store.id,
        title: "Скидка 500₽ на все наушники",
        subtitle: "Только сейчас — выгодная акция на весь ассортимент",
        image: "https://static.insales-cdn.com/r/4aVimONKqms/rs:fit:2000:2000:1/plain/files/1/4969/124760937/original/%D0%A1%D0%BA%D0%B8%D0%B4%D0%BA%D0%B0_500___%D0%BD%D0%B0_%D0%B2%D1%81%D0%B5_%D0%9D%D0%90%D0%A3%D0%A8%D0%9D%D0%98%D0%9A%D0%98__1_.png@png",
        link: "/store/gadget-market/catalog?category=naushniki",
        sortOrder: 0,
        isActive: true,
      },
      {
        storeId: store.id,
        title: "Apple — официальный ресселер",
        subtitle: "iPhone, MacBook, AirPods с гарантией 2 года",
        image: "https://static.insales-cdn.com/r/Sywe8GBOFvw/rs:fill-down:747:598:1/q:80/plain/files/1/3977/106778505/original/apple1__1_.png@webp",
        link: "/store/gadget-market/catalog?category=apple",
        sortOrder: 1,
        isActive: true,
      },
      {
        storeId: store.id,
        title: "Samsung Galaxy S25 Ultra",
        subtitle: "Флагман 2025 года — от 66 490 ₽",
        image: "https://static.insales-cdn.com/r/-QMHY-2a3wc/rs:fill-down:747:598:1/q:80/plain/files/1/3985/106778513/original/Samsung.png@webp",
        link: "/store/gadget-market/catalog?category=samsung",
        sortOrder: 2,
        isActive: true,
      },
    ],
  })
  console.log("✓ Banners created")

  // ─── Categories ───────────────────────────────────────────────────────────
  const categoryDefs = [
    { name: "Смартфоны", slug: "smartfony", image: "https://static.insales-cdn.com/images/collections/1/6385/97327345/medium_смартвофны.png" },
    { name: "Apple", slug: "apple", image: "https://static.insales-cdn.com/images/collections/1/1009/96576497/medium_1.jpg" },
    { name: "Samsung", slug: "samsung", image: "https://static.insales-cdn.com/images/collections/1/508/93569532/medium_8.webp" },
    { name: "Xiaomi", slug: "xiaomi", image: "https://static.insales-cdn.com/images/collections/1/1649/96511601/medium_15t.webp" },
    { name: "Аксессуары", slug: "aksessuary", image: "https://static.insales-cdn.com/images/collections/1/6126/80263150/medium_Baseus_Dual_Wireless_Charger_white.jpg" },
    { name: "Ноутбуки и компьютеры", slug: "noutbuki", image: "https://static.insales-cdn.com/images/collections/1/2561/96602625/medium_Ноутбуки.png" },
    { name: "Наушники и акустика", slug: "naushniki", image: "https://static.insales-cdn.com/images/collections/1/2569/96602633/medium_Акустика-Photoroom.png" },
    { name: "Умные часы", slug: "umnye-chasy", image: "https://static.insales-cdn.com/images/collections/1/2537/96602601/medium_ВАВАВАВА1.png" },
    { name: "Техника для уборки", slug: "tekhnika-dlya-uborki", image: "https://static.insales-cdn.com/images/collections/1/6166/93566998/medium_30.webp" },
    { name: "Товары для дома", slug: "tovary-dlya-doma", image: "https://static.insales-cdn.com/images/collections/1/2617/96602681/medium_для_дома.png" },
    { name: "Красота и здоровье", slug: "krasota-i-zdorove", image: "https://static.insales-cdn.com/images/collections/1/2937/96603001/medium_красота_.png" },
    { name: "Развлечения", slug: "razvlecheniya", image: "https://static.insales-cdn.com/images/collections/1/2577/96602641/medium_Консоли_.png" },
    { name: "Путешествия и спорт", slug: "sport", image: "https://static.insales-cdn.com/images/collections/1/2977/96603041/medium_Спорт.png" },
  ]

  const categoryMap: Record<string, string> = {}
  for (let i = 0; i < categoryDefs.length; i++) {
    const cat = categoryDefs[i]
    const created = await db.category.upsert({
      where: { storeId_slug: { storeId: store.id, slug: cat.slug } },
      update: { image: cat.image, sortOrder: i },
      create: { storeId: store.id, name: cat.name, slug: cat.slug, image: cat.image, sortOrder: i },
    })
    categoryMap[cat.slug] = created.id
  }
  console.log("✓ Categories:", Object.keys(categoryMap).length)

  // ─── Products ─────────────────────────────────────────────────────────────
  const products = [
    // Apple iPhones
    {
      name: "Apple iPhone 16e",
      slug: "apple-iphone-16e",
      categorySlug: "apple",
      price: 47990,
      comparePrice: 63990,
      stock: 15,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/6886/975559398/АВА1.jpg",
        "https://static.insales-cdn.com/images/products/1/6865/2461104849/iphone_16e_1.jpg",
        "https://static.insales-cdn.com/images/products/1/7457/2461105441/iphone_16e_2.jpg",
      ],
      description: "Apple iPhone 16e — новый доступный iPhone с мощным процессором A16 Bionic, отличной камерой 48 МП и поддержкой Apple Intelligence. Гарантия 2 года. Официальный ресселер.",
      tags: ["apple", "iphone", "смартфон"],
    },
    {
      name: "Apple iPhone 16",
      slug: "apple-iphone-16",
      categorySlug: "apple",
      price: 54990,
      comparePrice: 69990,
      stock: 20,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/6992/908270416/1.jpeg",
        "https://static.insales-cdn.com/images/products/1/8001/2460983105/iphone_16_1.jpg",
        "https://static.insales-cdn.com/images/products/1/8033/2460983137/iphone_16_2.jpg",
      ],
      description: "Apple iPhone 16 с процессором A18, камерой 48 МП + 24 МП, дисплеем Super Retina XDR 6.1\". Новый дизайн, кнопка камеры. Гарантия 2 года.",
      tags: ["apple", "iphone", "смартфон"],
    },
    {
      name: "Apple iPhone 16 Pro",
      slug: "apple-iphone-16-pro",
      categorySlug: "apple",
      price: 73490,
      comparePrice: 89990,
      stock: 12,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/6993/908270417/8lh5b55kub8k4cqfkxhx7plhh2jav1xm.jpg",
      ],
      description: "Apple iPhone 16 Pro — профессиональный камерофон с системой камер 48+48+12 МП, процессором A18 Pro, дисплеем ProMotion 6.3\". Корпус из титана.",
      tags: ["apple", "iphone", "pro", "смартфон"],
    },
    {
      name: "Apple iPhone 16 Pro Max",
      slug: "apple-iphone-16-pro-max",
      categorySlug: "apple",
      price: 90490,
      comparePrice: 110000,
      stock: 8,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/6994/908270418/9i4krpls9oelgzs2kth1dhd28xuqinw9.jpg",
      ],
      description: "Apple iPhone 16 Pro Max — максимальный флагман с дисплеем 6.9\", камерой 5× оптическим зумом, батареей 4685 мАч. Лучший iPhone 2024.",
      tags: ["apple", "iphone", "pro max", "флагман"],
    },
    {
      name: "Apple iPhone 13",
      slug: "apple-iphone-13",
      categorySlug: "apple",
      price: 40990,
      comparePrice: 52990,
      stock: 25,
      images: [
        "https://static.insales-cdn.com/images/products/1/6995/908270419/igr2l74icgdozho48xvncpg2lhp8wxu0.jpg",
      ],
      description: "Apple iPhone 13 — надёжный и проверенный временем iPhone с процессором A15 Bionic и камерой 12 МП.",
      tags: ["apple", "iphone", "смартфон"],
    },
    {
      name: "Apple iPhone 14",
      slug: "apple-iphone-14",
      categorySlug: "apple",
      price: 44990,
      comparePrice: 58990,
      stock: 18,
      images: [
        "https://static.insales-cdn.com/images/products/1/6996/908270420/rju2uw9ug6trtiu711p1e5hdvt71rwna.jpg",
      ],
      description: "Apple iPhone 14 с процессором A15 Bionic и улучшенной системой камер. Crash Detection и Emergency SOS.",
      tags: ["apple", "iphone", "смартфон"],
    },
    // Samsung
    {
      name: "Samsung Galaxy S25 Ultra",
      slug: "samsung-galaxy-s25-ultra",
      categorySlug: "samsung",
      price: 66490,
      comparePrice: 89990,
      stock: 10,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/6700/966351404/Снимок_экрана_2025-02-02_в_20.29.02.png",
        "https://static.insales-cdn.com/images/products/1/6703/966351407/Снимок_экрана_2025-02-02_в_20.29.26.png",
      ],
      description: "Samsung Galaxy S25 Ultra — флагман 2025 с встроенным S Pen, Snapdragon 8 Elite, камерой 200 МП. Дисплей Dynamic AMOLED 6.9\".",
      tags: ["samsung", "galaxy", "s25", "флагман", "смартфон"],
    },
    {
      name: "Samsung Galaxy S25",
      slug: "samsung-galaxy-s25",
      categorySlug: "samsung",
      price: 41490,
      comparePrice: 65990,
      stock: 20,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/174/966336686/Снимок_экрана_2025-02-02_в_20.34.36.png",
        "https://static.insales-cdn.com/images/products/1/175/966336687/Снимок_экрана_2025-02-02_в_20.34.41.png",
      ],
      description: "Samsung Galaxy S25 — компактный флагман с Snapdragon 8 Elite, камерой 50 МП и Galaxy AI функциями. Android 15.",
      tags: ["samsung", "galaxy", "s25", "смартфон"],
    },
    {
      name: "Samsung Galaxy Z TriFold",
      slug: "samsung-galaxy-z-trifold",
      categorySlug: "samsung",
      price: 349990,
      stock: 3,
      images: [
        "https://static.insales-cdn.com/images/products/1/4161/2460971073/Ава1.jpg",
        "https://static.insales-cdn.com/images/products/1/4305/2460971217/Ава2.jpg",
      ],
      description: "Samsung Galaxy Z TriFold — революционный складной смартфон с тремя дисплеями. Уникальный форм-фактор для максимального экрана.",
      tags: ["samsung", "складной", "trifold", "флагман"],
    },
    // Apple Watch
    {
      name: "Apple Watch Series 10 Titanium",
      slug: "apple-watch-series-10-titanium",
      categorySlug: "umnye-chasy",
      price: 72990,
      comparePrice: 88990,
      stock: 8,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/5689/2348561977/Снимок_экрана_2024-11-18_в_12.48.42.png",
        "https://static.insales-cdn.com/images/products/1/1904/935151472/Снимок_экрана_2024-11-18_в_12.48.45.png",
      ],
      description: "Apple Watch Series 10 Titanium — самые тонкие Apple Watch с экраном XDR +40% ярче, 50 м водозащитой, фиксацией сна. Корпус из титана.",
      tags: ["apple", "watch", "умные часы"],
    },
    // Xiaomi
    {
      name: "Xiaomi 15T Pro",
      slug: "xiaomi-15t-pro",
      categorySlug: "xiaomi",
      price: 47490,
      comparePrice: 65990,
      stock: 14,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/collections/1/1649/96511601/medium_15t.webp",
      ],
      description: "Xiaomi 15T Pro с Dimensity 9300+, тройной камерой Leica 50+50+12 МП, зарядкой 120 Вт. AMOLED 6.67\" 144 Гц.",
      tags: ["xiaomi", "смартфон", "leica"],
    },
    {
      name: "Xiaomi 17 Ultra",
      slug: "xiaomi-17-ultra",
      categorySlug: "xiaomi",
      price: 97490,
      comparePrice: 119990,
      stock: 5,
      images: [
        "https://static.insales-cdn.com/images/products/1/41/2460975145/Ава1.jpg",
        "https://static.insales-cdn.com/images/products/1/65/2460975169/Ава4.jpg",
      ],
      description: "Xiaomi 17 Ultra — флагман с камерой Leica 200 МП, Snapdragon 8 Elite, зарядкой 90 Вт беспроводной и 120 Вт проводной.",
      tags: ["xiaomi", "флагман", "leica", "ultra"],
    },
    {
      name: "Xiaomi Pad 7",
      slug: "xiaomi-pad-7",
      categorySlug: "xiaomi",
      price: 25990,
      comparePrice: 34990,
      stock: 10,
      images: [
        "https://static.insales-cdn.com/images/products/1/73/2460975177/Ава3.jpg",
      ],
      description: "Xiaomi Pad 7 — планшет с дисплеем 11.2\" 144 Гц, процессором Snapdragon 7s Gen 3, батареей 8850 мАч и зарядкой 45 Вт.",
      tags: ["xiaomi", "планшет", "pad"],
    },
    {
      name: "Xiaomi Dreame L50 Ultra",
      slug: "xiaomi-dreame-l50-ultra",
      categorySlug: "tekhnika-dlya-uborki",
      price: 69490,
      comparePrice: 89990,
      stock: 6,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/collections/1/6166/93566998/medium_30.webp",
      ],
      description: "Dreame L50 Ultra — робот-пылесос с влажной уборкой, самоочисткой швабры горячей водой, мощностью всасывания 17000 Па. Автоматическое опорожнение.",
      tags: ["пылесос", "робот", "dreame", "xiaomi"],
    },
    // Наушники
    {
      name: "Apple AirPods 4",
      slug: "apple-airpods-4",
      categorySlug: "naushniki",
      price: 9990,
      comparePrice: 17990,
      stock: 30,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/6903/975559415/Ава2.jpg",
      ],
      description: "Apple AirPods 4 — переработанный дизайн, улучшенный звук H2, персонализированный пространственный звук. До 30 часов с кейсом.",
      tags: ["apple", "airpods", "наушники"],
    },
    {
      name: "Redmi Buds 6 Pro",
      slug: "redmi-buds-6-pro",
      categorySlug: "naushniki",
      price: 5490,
      comparePrice: 7490,
      stock: 25,
      images: [
        "https://static.insales-cdn.com/images/collections/1/2569/96602633/medium_Акустика-Photoroom.png",
      ],
      description: "Redmi Buds 6 Pro с активным шумоподавлением, Hi-Res Audio, 3 микрофонами и временем работы до 38 часов.",
      tags: ["redmi", "xiaomi", "наушники", "twS"],
    },
    {
      name: "Samsung Galaxy Buds4 Pro",
      slug: "samsung-galaxy-buds4-pro",
      categorySlug: "naushniki",
      price: 19990,
      stock: 15,
      images: [
        "https://static.insales-cdn.com/images/products/1/81/2460975185/Ава2.jpg",
      ],
      description: "Samsung Galaxy Buds4 Pro с интеллектуальным ANC, HD звуком, автоматическим переключением между устройствами Galaxy.",
      tags: ["samsung", "galaxy buds", "наушники"],
    },
    // Аксессуары
    {
      name: "Baseus Dual Wireless Charger",
      slug: "baseus-dual-wireless-charger",
      categorySlug: "aksessuary",
      price: 2490,
      comparePrice: 3990,
      stock: 40,
      images: [
        "https://static.insales-cdn.com/images/collections/1/6126/80263150/medium_Baseus_Dual_Wireless_Charger_white.jpg",
      ],
      description: "Двойное беспроводное зарядное устройство Baseus — одновременно заряжает телефон и наушники. Мощность 15 Вт.",
      tags: ["baseus", "зарядка", "беспроводная"],
    },
    {
      name: "Apple EarPods USB-C",
      slug: "apple-earpods-usb-c",
      categorySlug: "aksessuary",
      price: 2990,
      stock: 50,
      images: [
        "https://static.insales-cdn.com/images/products/1/105/2460975209/Ава10.jpg",
      ],
      description: "Apple EarPods с разъёмом USB-C — проводные наушники с отличным качеством звука и встроенным микрофоном.",
      tags: ["apple", "earpods", "наушники", "usb-c"],
    },
    // Ноутбуки
    {
      name: "Apple MacBook Air M3 13\"",
      slug: "apple-macbook-air-m3-13",
      categorySlug: "noutbuki",
      price: 88490,
      comparePrice: 109990,
      stock: 7,
      isFeatured: true,
      images: [
        "https://static.insales-cdn.com/images/products/1/113/2460975217/Ава9.jpg",
      ],
      description: "MacBook Air M3 13\" — сверхтонкий ноутбук без вентилятора, до 18 часов работы, дисплей Liquid Retina. Идеален для работы и учёбы.",
      tags: ["apple", "macbook", "ноутбук", "m3"],
    },
    // Планшеты
    {
      name: "Apple iPad mini 7 (2024)",
      slug: "apple-ipad-mini-7",
      categorySlug: "apple",
      price: 40990,
      comparePrice: 54990,
      stock: 12,
      images: [
        "https://static.insales-cdn.com/images/products/1/121/2460975225/Ава8.jpg",
      ],
      description: "Apple iPad mini 7 с чипом A17 Pro, поддержкой Apple Pencil Pro и Apple Intelligence. Компактный и мощный планшет.",
      tags: ["apple", "ipad", "планшет"],
    },
  ]

  let created = 0
  for (const p of products) {
    const catId = categoryMap[p.categorySlug]
    await db.product.upsert({
      where: { storeId_slug: { storeId: store.id, slug: p.slug } },
      update: {
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        images: p.images,
        isFeatured: p.isFeatured ?? false,
        description: p.description,
      },
      create: {
        storeId: store.id,
        categoryId: catId ?? null,
        name: p.name,
        slug: p.slug,
        price: p.price,
        comparePrice: p.comparePrice ?? null,
        stock: p.stock,
        isActive: true,
        isFeatured: p.isFeatured ?? false,
        images: p.images,
        tags: p.tags,
        description: p.description,
      },
    })
    created++
  }
  console.log(`✓ Products: ${created}`)
  console.log("\n─────────────────────────────────")
  console.log(" Логин:  admin@myshop.ru")
  console.log(" Пароль: admin123")
  console.log("─────────────────────────────────")
}

main().catch(console.error).finally(() => db.$disconnect())
