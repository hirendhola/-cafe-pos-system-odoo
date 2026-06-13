import { OrderView } from "@/app/(pos)/_components/order-view"
import { prisma } from "@/lib/db"
import { computeOrderTotals, type DiscountSource } from "@/lib/pricing"

export default async function PosOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const { table: tableId } = await searchParams

  const [categories, [products, productsTotal], table, openSession, activePromotions] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    Promise.all([
      prisma.product.findMany({
        where: { active: true },
        include: { category: true },
        orderBy: { name: "asc" },
        take: 20,
      }),
      prisma.product.count({ where: { active: true } }),
    ]),
    tableId
      ? prisma.table.findUnique({
          where: { id: tableId },
          include: {
            floor: true,
            orders: {
              where: { status: "DRAFT" },
              include: {
                items: { include: { product: true }, orderBy: { createdAt: "asc" } },
                customer: true,
                coupon: { select: { code: true, discountType: true, value: true, active: true } },
              },
              take: 1,
            },
          },
        })
      : null,
    prisma.posSession.findFirst({ where: { closedAt: null }, select: { id: true } }),
    prisma.promotion.findMany({ where: { active: true } }),
  ])

  const order = table?.orders[0]
  let lineDiscountLabels = new Map<string, string>()
  let discountBreakdown: DiscountSource[] = []

  if (order) {
    const result = computeOrderTotals(order.items, activePromotions, order.coupon?.active ? order.coupon : null)
    lineDiscountLabels = result.lineDiscountLabels
    discountBreakdown = result.discountBreakdown
  }

  const tableWithDiscounts = table
    ? {
        ...table,
        orders: table.orders.map((o) => ({
          ...o,
          discountBreakdown,
          items: o.items.map((item) => ({ ...item, promoLabel: lineDiscountLabels.get(item.id) ?? null })),
        })),
      }
    : null

  return (
    <OrderView
      categories={categories}
      initialProducts={products}
      initialProductsTotal={productsTotal}
      table={tableWithDiscounts}
      hasOpenSession={!!openSession}
    />
  )
}
