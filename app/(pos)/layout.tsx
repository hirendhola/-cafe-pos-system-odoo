import { Suspense } from "react"

import { headers } from "next/headers"

import { PosNav } from "@/app/(pos)/_components/pos-nav"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function PosLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })

  const floors = await prisma.floor.findMany({
    include: {
      tables: {
        where: { active: true },
        include: { orders: { where: { status: "DRAFT" }, select: { id: true, number: true } } },
        orderBy: { number: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="flex h-svh flex-col">
      <Suspense fallback={<div className="h-14 border-b" />}>
        <PosNav user={session!.user} floors={floors} />
      </Suspense>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
