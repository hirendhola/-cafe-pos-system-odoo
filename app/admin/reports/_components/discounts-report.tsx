"use client"

import * as React from "react"

import { DateRangeFilter, defaultDateRange, type DateRangeValue } from "@/components/admin/date-range-filter"
import { ExportMenu } from "@/components/admin/export-menu"
import { KpiCard } from "@/components/admin/kpi-card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CsvColumn } from "@/lib/csv"
import { currency, number } from "@/lib/format"
import type { CouponUsageRow, DiscountsReport as DiscountsReportData, ProductPromoRow } from "@/lib/reports"

export function DiscountsReport() {
  const [range, setRange] = React.useState<DateRangeValue>(() => defaultDateRange())
  const [data, setData] = React.useState<DiscountsReportData | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() })
    fetch(`/api/reports/discounts?${params}`)
      .then((res) => res.json())
      .then((json: DiscountsReportData) => setData(json))
      .finally(() => setLoading(false))
  }, [range])

  const rangeSuffix = `${range.from.toISOString().slice(0, 10)}-to-${range.to.toISOString().slice(0, 10)}`

  const couponColumns: CsvColumn<CouponUsageRow>[] = [
    { key: "code", label: "Coupon Code" },
    { key: "active", label: "Status", format: (row) => (row.active ? "Active" : "Inactive") },
    { key: "timesUsed", label: "Times Used" },
    { key: "totalDiscount", label: "Total Discount", format: (row) => row.totalDiscount.toFixed(2) },
  ]

  const productPromoColumns: CsvColumn<ProductPromoRow>[] = [
    { key: "name", label: "Product" },
    { key: "timesApplied", label: "Times Applied" },
    { key: "totalDiscount", label: "Total Discount", format: (row) => row.totalDiscount.toFixed(2) },
  ]

  const couponTotal = data?.coupons.reduce((sum, row) => sum + row.totalDiscount, 0) ?? 0
  const productPromoTotal = data?.productPromos.reduce((sum, row) => sum + row.totalDiscount, 0) ?? 0
  const grandTotal = (data?.automatedOrderPromos.totalDiscount ?? 0) + couponTotal + productPromoTotal

  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter value={range} onChange={setRange} />

      {loading || !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <KpiCard label="Automated Order Promotions" value={number.format(data.automatedOrderPromos.count)} />
            <KpiCard label="Automated Promo Discount" value={currency.format(data.automatedOrderPromos.totalDiscount)} />
            <KpiCard label="Total Discounts Given" value={currency.format(grandTotal)} />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Coupon Usage</h2>
              <ExportMenu data={data.coupons} columns={couponColumns} filename={`coupon-usage-${rangeSuffix}`} sheetName="Coupon Usage" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Coupon Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Times Used</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No coupons used in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.coupons.map((coupon) => (
                    <TableRow key={coupon.couponId}>
                      <TableCell className="font-medium">{coupon.code}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.active ? "default" : "secondary"}>
                          {coupon.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{number.format(coupon.timesUsed)}</TableCell>
                      <TableCell className="text-right">{currency.format(coupon.totalDiscount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium">Product Promotions</h2>
              <ExportMenu
                data={data.productPromos}
                columns={productPromoColumns}
                filename={`product-promotions-${rangeSuffix}`}
                sheetName="Product Promotions"
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Times Applied</TableHead>
                  <TableHead className="text-right">Total Discount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.productPromos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No product promotions applied in this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.productPromos.map((promo) => (
                    <TableRow key={promo.productId}>
                      <TableCell className="font-medium">{promo.name}</TableCell>
                      <TableCell className="text-right">{number.format(promo.timesApplied)}</TableCell>
                      <TableCell className="text-right">{currency.format(promo.totalDiscount)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  )
}
