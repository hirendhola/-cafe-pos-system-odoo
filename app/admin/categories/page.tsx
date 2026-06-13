import { CategoriesView } from "@/app/admin/categories/_components/categories-view"
import { prisma } from "@/lib/db"

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  })

  return <CategoriesView initialCategories={categories} />
}
