import { CustomersTable } from "./customers-table"

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Клиенты</h1>
      <CustomersTable />
    </div>
  )
}
