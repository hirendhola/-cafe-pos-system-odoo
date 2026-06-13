import { KdsBoard } from "@/app/(pos)/kds/_components/kds-board"
import { prisma } from "@/lib/db"

export default async function KdsPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } })

  return <KdsBoard categories={categories} />
}
