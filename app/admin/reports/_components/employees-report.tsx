"use client"

import * as React from "react"

import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react"

import { EmployeeRevenueChart } from "@/components/admin/charts/employee-revenue-chart"
import { DateRangeFilter, defaultDateRange, type DateRangeValue } from "@/components/admin/date-range-filter"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { downloadCsv, toCsv } from "@/lib/csv"
import { currency, number } from "@/lib/format"
import type { EmployeeReportRow } from "@/lib/reports"

type SortKey = "name" | "ordersPaid" | "revenue" | "aov" | "ordersCreated"

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Employee" },
  { key: "ordersPaid", label: "Orders Handled", align: "right" },
  { key: "revenue", label: "Revenue", align: "right" },
  { key: "aov", label: "Avg. Order Value", align: "right" },
  { key: "ordersCreated", label: "Orders Created", align: "right" },
]

export function EmployeesReport() {
  const [range, setRange] = React.useState<DateRangeValue>(() => defaultDateRange())
  const [rows, setRows] = React.useState<EmployeeReportRow[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sortKey, setSortKey] = React.useState<SortKey>("revenue")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")

  React.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() })
    fetch(`/api/reports/employees?${params}`)
      .then((res) => res.json())
      .then((json: { employees: EmployeeReportRow[] }) => setRows(json.employees))
      .finally(() => setLoading(false))
  }, [range])

  const sorted = React.useMemo(() => {
    if (!rows) return []
    const copy = [...rows]
    copy.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })
    return copy
  }, [rows, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const handleExport = () => {
    if (!rows) return

    const csv = toCsv(rows, [
      { key: "name", label: "Employee" },
      { key: "ordersPaid", label: "Orders Handled" },
      { key: "revenue", label: "Revenue", format: (row) => row.revenue.toFixed(2) },
      { key: "aov", label: "Avg. Order Value", format: (row) => row.aov.toFixed(2) },
      { key: "ordersCreated", label: "Orders Created" },
    ])

    downloadCsv(`employees-${range.from.toISOString().slice(0, 10)}-to-${range.to.toISOString().slice(0, 10)}.csv`, csv)
  }

  const chartData = sorted.slice(0, 8).map((row) => ({ name: row.name, revenue: row.revenue }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <DateRangeFilter value={range} onChange={setRange} />
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!rows}>
          <Download /> Export CSV
        </Button>
      </div>

      {loading || !rows ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <EmployeeRevenueChart data={chartData} />

          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col.key} className={col.align === "right" ? "text-right" : undefined}>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={() => toggleSort(col.key)}
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : (
                        <ArrowUpDown className="size-3 text-muted-foreground/50" />
                      )}
                    </button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    No employee activity in this period.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.name}</TableCell>
                    <TableCell className="text-right">{number.format(row.ordersPaid)}</TableCell>
                    <TableCell className="text-right">{currency.format(row.revenue)}</TableCell>
                    <TableCell className="text-right">{currency.format(row.aov)}</TableCell>
                    <TableCell className="text-right">{number.format(row.ordersCreated)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      )}
    </div>
  )
}
