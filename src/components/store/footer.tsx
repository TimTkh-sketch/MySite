import Link from "next/link"
import { Phone, MapPin, Clock } from "lucide-react"

interface Store {
  name: string
  slug: string
  settings?: {
    phone?: string | null
    address?: string | null
    workingHours?: string | null
    socialVk?: string | null
    socialTg?: string | null
  } | null
}

export function StoreFooter({ store }: { store: Store }) {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="font-bold text-white text-lg mb-3">{store.name}</p>
            <p className="text-sm text-gray-400">Самый дружелюбный магазин гаджетов</p>
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white text-sm">Контакты</p>
            {store.settings?.phone && (
              <a href={`tel:${store.settings.phone}`} className="flex items-center gap-2 text-sm hover:text-white">
                <Phone className="h-4 w-4 shrink-0" />
                {store.settings.phone}
              </a>
            )}
            {store.settings?.address && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 shrink-0" />
                {store.settings.address}
              </div>
            )}
            {store.settings?.workingHours && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 shrink-0" />
                {store.settings.workingHours}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="font-semibold text-white text-sm">Магазин</p>
            <Link href={`/store/${store.slug}/catalog`} className="block text-sm hover:text-white">Каталог</Link>
            <Link href={`/store/${store.slug}/checkout`} className="block text-sm hover:text-white">Корзина</Link>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} {store.name}. Все права защищены.
        </div>
      </div>
    </footer>
  )
}
