import { notFound } from "next/navigation"

import { OrderDetailView } from "@/components/orders/order-detail-view"
import { prisma } from "@/lib/db"

export default async function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

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
    <OrderDetailView
      basePath="/admin/orders"
      editable={order.status === "DRAFT"}
      showAudit
      showCancelAction
      order={{
        ...order,
        createdAt: order.createdAt.toISOString(),
        paidAt: order.paidAt?.toISOString() ?? null,
        cancelledAt: order.cancelledAt?.toISOString() ?? null,
      }}
    />
  )
}
