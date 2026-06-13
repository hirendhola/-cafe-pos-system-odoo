"use client"

import * as React from "react"

import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-react"

import { CategoryBreakdownChart } from "@/components/admin/charts/category-breakdown-chart"
import { TopProductsChart } from "@/components/admin/charts/top-products-chart"
import { DateRangeFilter, defaultDateRange, type DateRangeValue } from "@/components/admin/date-range-filter"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { downloadCsv, toCsv } from "@/lib/csv"
import { currency, number } from "@/lib/format"
import type { CategoryReportRow, ItemReportRow } from "@/lib/reports"

const ALL = "all"

type SortKey = "name" | "categoryName" | "qty" | "grossRevenue" | "discount" | "netRevenue"

const columns: { key: SortKey; label: string; align?: "right" }[] = [
  { key: "name", label: "Product" },
  { key: "categoryName", label: "Category" },
  { key: "qty", label: "Qty Sold", align: "right" },
  { key: "grossRevenue", label: "Gross Revenue", align: "right" },
  { key: "discount", label: "Discount Given", align: "right" },
  { key: "netRevenue", label: "Net Revenue", align: "right" },
]

type ItemsReportResponse = { items: ItemReportRow[]; categories: CategoryReportRow[] }

export function ItemsReport({ categories }: { categories: { id: string; name: string }[] }) {
  const [range, setRange] = React.useState<DateRangeValue>(() => defaultDateRange())
  const [categoryId, setCategoryId] = React.useState(ALL)
  const [data, setData] = React.useState<ItemsReportResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [sortKey, setSortKey] = React.useState<SortKey>("netRevenue")
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc")

  React.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() })
    if (categoryId !== ALL) params.set("categoryId", categoryId)
    fetch(`/api/reports/items?${params}`)
      .then((res) => res.json())
      .then((json: ItemsReportResponse) => setData(json))
      .finally(() => setLoading(false))
  }, [range, categoryId])

  const sorted = React.useMemo(() => {
    if (!data) return []
    const copy = [...data.items]
    copy.sort((a, b) => {
      const aVal = a[sortKey]
      const bVal = b[sortKey]
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal)
    })
    return copy
  }, [data, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((dir) => (dir === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const handleExport = () => {
    if (!data) return

    const csv = toCsv(data.items, [
      { key: "name", label: "Product" },
      { key: "categoryName", label: "Category" },
      { key: "qty", label: "Qty Sold" },
      { key: "grossRevenue", label: "Gross Revenue", format: (row) => row.grossRevenue.toFixed(2) },
      { key: "discount", label: "Discount Given", format: (row) => row.discount.toFixed(2) },
      { key: "netRevenue", label: "Net Revenue", format: (row) => row.netRevenue.toFixed(2) },
    ])

    downloadCsv(`items-${range.from.toISOString().slice(0, 10)}-to-${range.to.toISOString().slice(0, 10)}.csv`, csv)
  }

  const topProducts = (data?.items ?? []).slice(0, 10).map((item) => ({ name: item.name, netRevenue: item.netRevenue }))

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DateRangeFilter value={range} onChange={setRange} />
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!data}>
          <Download /> Export CSV
        </Button>
      </div>

      {loading || !data ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-6">
              <TopProductsChart data={topProducts} title="Top Products" />
            </div>
            <div className="xl:col-span-6">
              <CategoryBreakdownChart data={data.categories} />
            </div>
          </div>

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
                    No items sold in this period.
                  </TableCell>
                </TableRow>
              ) : (
                sorted.map((item) => (
                  <TableRow key={item.productId}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-muted-foreground">{item.categoryName}</TableCell>
                    <TableCell className="text-right">{number.format(item.qty)}</TableCell>
                    <TableCell className="text-right">{currency.format(item.grossRevenue)}</TableCell>
                    <TableCell className="text-right">{currency.format(item.discount)}</TableCell>
                    <TableCell className="text-right">{currency.format(item.netRevenue)}</TableCell>
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
