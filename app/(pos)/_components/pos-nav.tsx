"use client"

import * as React from "react"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import { LayoutGrid, ReceiptText, ShieldCheck, Table2, UtensilsCrossed } from "lucide-react"

import { FloorTablePopup, type FloorWithTables } from "@/app/(pos)/_components/floor-table-popup"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { SessionBar } from "@/components/pos/session-bar"
import { Button } from "@/components/ui/button"

const navLinks = [
  { href: "/pos", label: "Order View", icon: LayoutGrid },
  { href: "/kds", label: "Kitchen Display", icon: UtensilsCrossed },
  { href: "/orders", label: "Orders", icon: ReceiptText },
]

export function PosNav({
  user,
  floors,
}: {
  user: { name: string; email: string; role: string }
  floors: FloorWithTables[]
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [tableOpen, setTableOpen] = React.useState(false)

  const selectedTableId = searchParams.get("table")

  const selectedTable = React.useMemo(() => {
    for (const floor of floors) {
      const table = floor.tables.find((t) => t.id === selectedTableId)
      if (table) return { floor, table }
    }
    return null
  }, [floors, selectedTableId])

  return (
    <header className="flex h-14 items-center gap-2 overflow-x-auto border-b px-4">
      <div className="flex shrink-0 items-center gap-2 font-medium">
        <UtensilsCrossed className="size-5" />
        <span className="hidden sm:inline">Cafe POS</span>
      </div>

      <nav className="flex shrink-0 items-center gap-1">
        {navLinks.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href

          return (
            <Button key={link.href} asChild size="sm" variant={isActive ? "secondary" : "ghost"}>
              <Link href={link.href}>
                <Icon /> <span className="hidden lg:inline">{link.label}</span>
              </Link>
            </Button>
          )
        })}
        {user.role === "ADMIN" ? (
          <Button asChild size="sm" variant="ghost">
            <Link href="/admin/products">
              <ShieldCheck /> <span className="hidden lg:inline">Admin</span>
            </Link>
          </Button>
        ) : null}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <SessionBar />
        <Button size="sm" variant="outline" onClick={() => setTableOpen(true)}>
          <Table2 />
          {selectedTable ? (
            <>
              <span className="hidden sm:inline">{`Table ${selectedTable.table.number} · ${selectedTable.floor.name}`}</span>
              <span className="sm:hidden">{`T${selectedTable.table.number}`}</span>
            </>
          ) : (
            "Select table"
          )}
        </Button>
        <div className="hidden text-right text-sm xl:block">
          <div className="font-medium">{user.name}</div>
          <div className="text-muted-foreground">{user.email}</div>
        </div>
        <SignOutButton />
      </div>

      <FloorTablePopup floors={floors} open={tableOpen} onOpenChange={setTableOpen} selectedTableId={selectedTableId} />
    </header>
  )
}
