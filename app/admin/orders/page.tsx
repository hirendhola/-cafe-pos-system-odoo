import { OrdersTable } from "@/components/orders/orders-table"
import { prisma } from "@/lib/db"

export default async function AdminOrdersPage() {
  const [employees, sessions] = await Promise.all([
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.posSession.findMany({
      select: { id: true, openedAt: true, openedBy: { select: { name: true } } },
      orderBy: { openedAt: "desc" },
    }),
  ])

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Orders</h1>
      <OrdersTable
        basePath="/admin/orders"
        showEmployee
        employees={employees}
        sessions={sessions.map((session) => ({ ...session, openedAt: session.openedAt.toISOString() }))}
      />
    </div>
  )
}
