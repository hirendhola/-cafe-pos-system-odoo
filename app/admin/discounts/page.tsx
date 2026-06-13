import { DiscountsView } from "@/app/admin/discounts/_components/discounts-view"
import { prisma } from "@/lib/db"

export default async function DiscountsPage() {
  const [coupons, promotions, products] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.promotion.findMany({
      include: { product: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ])

  return <DiscountsView initialCoupons={coupons} initialPromotions={promotions} products={products} />
}
