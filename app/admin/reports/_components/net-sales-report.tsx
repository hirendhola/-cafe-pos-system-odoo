"use client"

import * as React from "react"

import { Download } from "lucide-react"

import { CategoryBreakdownChart } from "@/components/admin/charts/category-breakdown-chart"
import { PaymentBreakdownChart } from "@/components/admin/charts/payment-breakdown-chart"
import { SalesTrendChart } from "@/components/admin/charts/sales-trend-chart"
import { DateRangeFilter, defaultDateRange, type DateRangeValue } from "@/components/admin/date-range-filter"
import { KpiCard } from "@/components/admin/kpi-card"
import { Button } from "@/components/ui/button"
import { downloadCsv, toCsv } from "@/lib/csv"
import { currency, number } from "@/lib/format"
import type { CategoryReportRow, NetSalesSummary, SalesTrendPoint } from "@/lib/reports"

type SalesReportResponse = {
  summary: NetSalesSummary
  trend: SalesTrendPoint[]
  categories: CategoryReportRow[]
}

export function NetSalesReport() {
  const [range, setRange] = React.useState<DateRangeValue>(() => defaultDateRange())
  const [data, setData] = React.useState<SalesReportResponse | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() })
    fetch(`/api/reports/sales?${params}`)
      .then((res) => res.json())
      .then((json: SalesReportResponse) => setData(json))
      .finally(() => setLoading(false))
  }, [range])

  const handleExport = () => {
    if (!data) return

    const csv = toCsv(data.trend, [
      { key: "label", label: "Period" },
      { key: "grossSales", label: "Gross Sales", format: (row) => row.grossSales.toFixed(2) },
      { key: "discount", label: "Discount", format: (row) => row.discount.toFixed(2) },
      { key: "netSales", label: "Net Sales", format: (row) => row.netSales.toFixed(2) },
      { key: "tax", label: "Tax", format: (row) => row.tax.toFixed(2) },
      { key: "total", label: "Total Revenue", format: (row) => row.total.toFixed(2) },
      { key: "orders", label: "Orders" },
    ])

    downloadCsv(`net-sales-${range.from.toISOString().slice(0, 10)}-to-${range.to.toISOString().slice(0, 10)}.csv`, csv)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DateRangeFilter value={range} onChange={setRange} />
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
          <Download /> Export CSV
        </Button>
      </div>

      {loading || !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            <KpiCard label="Gross Sales" value={currency.format(data.summary.grossSales)} />
            <KpiCard label="Total Discounts" value={currency.format(data.summary.totalDiscount)} />
            <KpiCard label="Net Sales" value={currency.format(data.summary.netSales)} />
            <KpiCard label="Tax Collected" value={currency.format(data.summary.tax)} />
            <KpiCard label="Total Revenue" value={currency.format(data.summary.totalRevenue)} />
            <KpiCard label="Orders" value={number.format(data.summary.ordersCount)} />
            <KpiCard label="Avg. Order Value" value={currency.format(data.summary.aov)} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-7">
              <SalesTrendChart
                data={data.trend.map((point) => ({ label: point.label, netSales: point.netSales, orders: point.orders }))}
              />
            </div>
            <div className="xl:col-span-5">
              <PaymentBreakdownChart data={data.summary.byPaymentType} />
            </div>
            <div className="xl:col-span-12">
              <CategoryBreakdownChart data={data.categories} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
