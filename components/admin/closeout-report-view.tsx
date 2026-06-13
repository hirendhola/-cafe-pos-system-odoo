"use client"

import * as React from "react"

import { format } from "date-fns"
import { Printer } from "lucide-react"

import { PaymentBreakdownChart } from "@/components/admin/charts/payment-breakdown-chart"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { currency, number } from "@/lib/format"
import type { CategoryReportRow, DiscountsReport, EmployeeReportRow, ItemReportRow, NetSalesSummary } from "@/lib/reports"

type CloseoutData = {
  session: {
    id: string
    openedAt: string
    closedAt: string | null
    openedBy: string
    closedBy: string | null
    closingAmount: number | null
    expectedCash: number | null
  }
  cashSummary: {
    openingAmount: number
    cashSales: number
    cardSales: number
    upiSales: number
    ordersCount: number
    grandTotal: number
    expectedCash: number
  }
  salesSummary: NetSalesSummary
  employeeActivity: EmployeeReportRow[]
  topItems: ItemReportRow[]
  categories: CategoryReportRow[]
  discounts: DiscountsReport
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  )
}

export function CloseoutReportView({ sessionId }: { sessionId: string }) {
  const [data, setData] = React.useState<CloseoutData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    fetch(`/api/sessions/${sessionId}/closeout`)
      .then((res) => res.json())
      .then((json: CloseoutData) => setData(json))
      .finally(() => setLoading(false))
  }, [sessionId])

  if (loading || !data) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
  }

  const { session, cashSummary, salesSummary, employeeActivity, topItems, discounts } = data
  const variance =
    session.closedAt && session.closingAmount !== null ? session.closingAmount - cashSummary.expectedCash : null

  const hasDiscounts = discounts.automatedOrderPromos.count > 0 || discounts.coupons.length > 0 || discounts.productPromos.length > 0

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">Daily Close-out Report</h2>
          <p className="text-sm text-muted-foreground">
            Opened {format(new Date(session.openedAt), "dd MMM yyyy, HH:mm")} by {session.openedBy}
            {session.closedAt ? (
              <>
                {" "}
                · Closed {format(new Date(session.closedAt), "dd MMM yyyy, HH:mm")} by {session.closedBy}
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={session.closedAt ? "secondary" : "default"}>{session.closedAt ? "Closed" : "Open"}</Badge>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer /> Print
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Cash Reconciliation</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <SummaryRow label="Opening cash" value={currency.format(cashSummary.openingAmount)} />
            <SummaryRow label="+ Cash sales" value={currency.format(cashSummary.cashSales)} />
            <Separator className="my-1" />
            <SummaryRow label="Expected cash in drawer" value={currency.format(cashSummary.expectedCash)} emphasize />
            {session.closingAmount !== null ? (
              <>
                <SummaryRow label="Counted (closing amount)" value={currency.format(session.closingAmount)} />
                <SummaryRow
                  label="Variance"
                  value={
                    variance === 0
                      ? "Matches expected"
                      : `${variance! > 0 ? "+" : "-"}${currency.format(Math.abs(variance!))}`
                  }
                  emphasize={variance !== 0}
                />
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Session is still open — no closing amount recorded yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Sales Summary</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <SummaryRow label="Gross sales" value={currency.format(salesSummary.grossSales)} />
            <SummaryRow label="Discounts" value={currency.format(salesSummary.totalDiscount)} />
            <SummaryRow label="Net sales" value={currency.format(salesSummary.netSales)} />
            <SummaryRow label="Tax" value={currency.format(salesSummary.tax)} />
            <Separator className="my-1" />
            <SummaryRow label="Total revenue" value={currency.format(salesSummary.totalRevenue)} emphasize />
            <SummaryRow label="Orders" value={number.format(salesSummary.ordersCount)} />
            <SummaryRow label="Avg. order value" value={currency.format(salesSummary.aov)} />
          </CardContent>
        </Card>
      </div>

      <PaymentBreakdownChart data={salesSummary.byPaymentType} title="Payments This Session" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Top Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Qty Sold</TableHead>
                <TableHead className="text-right">Net Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-20 text-center text-muted-foreground">
                    No items sold this session.
                  </TableCell>
                </TableRow>
              ) : (
                topItems.slice(0, 10).map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">{number.format(item.qty)}</TableCell>
                    <TableCell className="text-right">{currency.format(item.netRevenue)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {hasDiscounts ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Discounts &amp; Promotions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {discounts.automatedOrderPromos.count > 0 ? (
              <SummaryRow
                label={`Automated order promotions (${number.format(discounts.automatedOrderPromos.count)})`}
                value={currency.format(discounts.automatedOrderPromos.totalDiscount)}
              />
            ) : null}
            {discounts.coupons.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Coupons</p>
                {discounts.coupons.map((coupon) => (
                  <SummaryRow
                    key={coupon.couponId}
                    label={`${coupon.code} (×${coupon.timesUsed})`}
                    value={currency.format(coupon.totalDiscount)}
                  />
                ))}
              </div>
            ) : null}
            {discounts.productPromos.length > 0 ? (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Product promotions</p>
                {discounts.productPromos.map((promo) => (
                  <SummaryRow
                    key={promo.productId}
                    label={`${promo.name} (×${promo.timesApplied})`}
                    value={currency.format(promo.totalDiscount)}
                  />
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {employeeActivity.length > 1 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Employee Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="text-right">Orders Handled</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="text-right">Orders Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employeeActivity.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{number.format(row.ordersPaid)}</TableCell>
                    <TableCell className="text-right">{currency.format(row.revenue)}</TableCell>
                    <TableCell className="text-right">{number.format(row.ordersCreated)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
