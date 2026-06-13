import { ProductsView } from "@/app/admin/products/_components/products-view"
import { prisma } from "@/lib/db"

const PAGE_SIZE = 20

export default async function ProductsPage() {
  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" }, take: PAGE_SIZE }),
    prisma.product.count(),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return <ProductsView initialProducts={products} initialProductsTotal={total} initialCategories={categories} />
}
