import { CustomersView } from "@/app/admin/customers/_components/customers-view"
import { prisma } from "@/lib/db"

const PAGE_SIZE = 20

export default async function CustomersPage() {
  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      include: { _count: { select: { orders: true } } },
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
    }),
    prisma.customer.count(),
  ])

  return (
    <CustomersView
      initialCustomers={customers.map((customer) => ({ ...customer, createdAt: customer.createdAt.toISOString() }))}
      initialCustomersTotal={total}
    />
  )
}
