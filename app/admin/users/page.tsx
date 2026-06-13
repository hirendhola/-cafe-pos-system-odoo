import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { UsersView } from "@/app/admin/users/_components/users-view"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export default async function UsersPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (session?.user.role !== "ADMIN") {
    redirect("/admin/products")
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, archived: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  return (
    <UsersView
      initialUsers={users.map((user) => ({ ...user, createdAt: user.createdAt.toISOString() }))}
      currentUserId={session!.user.id}
    />
  )
}
