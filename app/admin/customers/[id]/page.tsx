import { notFound } from "next/navigation"

import { CustomerDetailView } from "@/app/admin/customers/[id]/_components/customer-detail-view"
import { prisma } from "@/lib/db"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          createdAt: true,
          table: { select: { number: true, floor: { select: { name: true } } } },
        },
      },
    },
  })

  if (!customer) {
    notFound()
  }

  return (
    <CustomerDetailView
      customer={{
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        createdAt: customer.createdAt.toISOString(),
      }}
      orders={customer.orders.map((order) => ({
        id: order.id,
        number: order.number,
        status: order.status,
        total: order.total,
        createdAt: order.createdAt.toISOString(),
        table: order.table ? { number: order.table.number, floorName: order.table.floor.name } : null,
      }))}
    />
  )
}
