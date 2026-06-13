import { ProductsView } from "@/app/admin/products/_components/products-view"
import { prisma } from "@/lib/db"

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    prisma.product.findMany({ include: { category: true }, orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ])

  return <ProductsView initialProducts={products} initialCategories={categories} />
}
