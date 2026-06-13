import { headers } from "next/headers"

import { OrdersTable } from "@/components/orders/orders-table"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function PosOrdersPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user

  const openSession = await prisma.posSession.findFirst({ where: { closedAt: null }, select: { id: true } })

  const fixedParams: Record<string, string> = openSession
    ? { sessionId: openSession.id }
    : { employeeId: user.id }

  return (
    <div className="h-full overflow-y-auto p-4">
      <h1 className="mb-4 text-lg font-semibold">Orders</h1>
      <OrdersTable basePath="/orders" showEmployee={user.role === "ADMIN"} fixedParams={fixedParams} />
    </div>
  )
}
