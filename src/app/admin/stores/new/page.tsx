import { StoreForm } from "@/components/admin/store-form"

export default function NewStorePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Создать магазин</h1>
      <StoreForm />
    </div>
  )
}
