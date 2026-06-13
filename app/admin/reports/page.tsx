import { prisma } from "@/lib/db"

import { ReportsView } from "./_components/reports-view"

export default async function AdminReportsPage() {
  const employees = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">Sales, orders, employee, item and discount reporting.</p>
      </div>

      <ReportsView employees={employees} />
    </div>
  )
}
