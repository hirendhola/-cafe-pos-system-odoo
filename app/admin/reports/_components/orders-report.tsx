"use client"

import * as React from "react"

import { format } from "date-fns"

import { OrderStatusChart } from "@/components/admin/charts/order-status-chart"
import { DateRangeFilter, defaultDateRange, type DateRangeValue } from "@/components/admin/date-range-filter"
import { KpiCard } from "@/components/admin/kpi-card"
import { OrdersTable } from "@/components/orders/orders-table"
import { number } from "@/lib/format"

type OrdersReportResponse = {
  total: number
  byStatus: { DRAFT: number; PAID: number; CANCELLED: number }
  dineIn: number
  takeaway: number
}

export function OrdersReport({ employees }: { employees: { id: string; name: string }[] }) {
  const [range, setRange] = React.useState<DateRangeValue>(() => defaultDateRange())
  const [data, setData] = React.useState<OrdersReportResponse | null>(null)
  const [loading, setLoading] = React.useState(true)

  const from = format(range.from, "yyyy-MM-dd")
  const to = format(range.to, "yyyy-MM-dd")

  React.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from, to })
    fetch(`/api/reports/orders?${params}`)
      .then((res) => res.json())
      .then((json: OrdersReportResponse) => setData(json))
      .finally(() => setLoading(false))
  }, [from, to])

  const fixedParams = React.useMemo(() => ({ from, to }), [from, to])

  return (
    <div className="flex flex-col gap-4">
      <DateRangeFilter value={range} onChange={setRange} />

      {loading || !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:col-span-8 xl:grid-cols-4">
            <KpiCard label="Total Orders" value={number.format(data.total)} />
            <KpiCard label="Paid" value={number.format(data.byStatus.PAID)} />
            <KpiCard label="Draft" value={number.format(data.byStatus.DRAFT)} />
            <KpiCard label="Cancelled" value={number.format(data.byStatus.CANCELLED)} />
            <KpiCard label="Dine-in" value={number.format(data.dineIn)} />
            <KpiCard label="Takeaway" value={number.format(data.takeaway)} />
          </div>
          <div className="xl:col-span-4">
            <OrderStatusChart data={data.byStatus} />
          </div>
        </div>
      )}

      <OrdersTable basePath="/admin/orders" showEmployee employees={employees} fixedParams={fixedParams} hideDateFilter />
    </div>
  )
}
