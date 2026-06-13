import { CustomersView } from "@/app/admin/customers/_components/customers-view"
import { prisma } from "@/lib/db"

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <CustomersView
      initialCustomers={customers.map((customer) => ({ ...customer, createdAt: customer.createdAt.toISOString() }))}
    />
  )
}
