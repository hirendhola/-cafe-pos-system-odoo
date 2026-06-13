import { OrderView } from "@/app/(pos)/_components/order-view"
import { prisma } from "@/lib/db"

export default async function PosOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const { table: tableId } = await searchParams

  const [categories, products, table] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      orderBy: { name: "asc" },
    }),
    tableId
      ? prisma.table.findUnique({
          where: { id: tableId },
          include: {
            floor: true,
            orders: {
              where: { status: "DRAFT" },
              include: { items: { include: { product: true }, orderBy: { createdAt: "asc" } } },
              take: 1,
            },
          },
        })
      : null,
  ])

  return <OrderView categories={categories} products={products} table={table} />
}
