import { ArrowDownRight, ArrowUpRight, Clock, Receipt, ShoppingBag, Wallet } from "lucide-react"

import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { currency } from "@/lib/format"
import type { NetSalesSummary } from "@/lib/reports"

function DeltaBadge({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="text-muted-foreground">No data for yesterday</span>
  }

  const delta = (current - previous) / previous
  const positive = delta >= 0
  const Icon = positive ? ArrowUpRight : ArrowDownRight

  return (
    <span className={`inline-flex items-center gap-1 ${positive ? "text-emerald-600" : "text-destructive"}`}>
      <Icon className="size-3.5" />
      {Math.abs(delta * 100).toFixed(1)}%
      <span className="text-muted-foreground">vs yesterday</span>
    </span>
  )
}

export function KpiCards({
  today,
  yesterday,
  session,
}: {
  today: NetSalesSummary
  yesterday: NetSalesSummary
  session: { openedAt: string; expectedCash: number } | null
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">Today&apos;s Net Sales</CardTitle>
          <CardDescription className="text-2xl font-semibold text-foreground tabular-nums">
            {currency.format(today.netSales)}
          </CardDescription>
          <CardAction className="grid size-8 place-items-center rounded-md bg-muted">
            <Wallet className="size-4 text-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <DeltaBadge current={today.netSales} previous={yesterday.netSales} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">Today&apos;s Orders</CardTitle>
          <CardDescription className="text-2xl font-semibold text-foreground tabular-nums">
            {today.ordersCount}
          </CardDescription>
          <CardAction className="grid size-8 place-items-center rounded-md bg-muted">
            <ShoppingBag className="size-4 text-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <DeltaBadge current={today.ordersCount} previous={yesterday.ordersCount} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">Today&apos;s Average Order</CardTitle>
          <CardDescription className="text-2xl font-semibold text-foreground tabular-nums">
            {currency.format(today.aov)}
          </CardDescription>
          <CardAction className="grid size-8 place-items-center rounded-md bg-muted">
            <Receipt className="size-4 text-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <DeltaBadge current={today.aov} previous={yesterday.aov} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-normal text-muted-foreground">Session Status</CardTitle>
          <CardDescription className="text-2xl font-semibold text-foreground tabular-nums">
            {session ? currency.format(session.expectedCash) : "Closed"}
          </CardDescription>
          <CardAction className="grid size-8 place-items-center rounded-md bg-muted">
            <Clock className="size-4 text-foreground" />
          </CardAction>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {session ? (
              <>
                Open since{" "}
                {new Date(session.openedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ·
                expected cash in drawer
              </>
            ) : (
              "No session open right now"
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
