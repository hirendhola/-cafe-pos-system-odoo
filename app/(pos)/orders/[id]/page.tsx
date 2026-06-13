import { headers } from "next/headers"
import { notFound } from "next/navigation"

import { OrderDetailView } from "@/components/orders/order-detail-view"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function PosOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  const user = session!.user

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { category: true } } }, orderBy: { createdAt: "asc" } },
      table: { include: { floor: true } },
      customer: true,
      createdBy: { select: { name: true } },
      paidBy: { select: { name: true } },
    },
  })

  if (!order) {
    notFound()
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <OrderDetailView
        basePath="/orders"
        editable={order.status === "DRAFT"}
        showAudit={user.role === "ADMIN"}
        order={{
          ...order,
          createdAt: order.createdAt.toISOString(),
          paidAt: order.paidAt?.toISOString() ?? null,
          cancelledAt: order.cancelledAt?.toISOString() ?? null,
        }}
      />
    </div>
  )
}
