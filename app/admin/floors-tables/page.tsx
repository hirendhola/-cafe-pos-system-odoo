import { FloorsTablesView } from "@/app/admin/floors-tables/_components/floors-tables-view"
import { prisma } from "@/lib/db"

export default async function FloorsTablesPage() {
  const floors = await prisma.floor.findMany({
    include: { tables: { orderBy: { number: "asc" } } },
    orderBy: { name: "asc" },
  })

  return <FloorsTablesView initialFloors={floors} />
}
