"use client"

import * as React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { format } from "date-fns"
import { CalendarIcon, Search } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { cn } from "@/lib/utils"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

const PAGE_SIZE = 20
const ALL = "all"

type OrderStatus = "DRAFT" | "PAID" | "CANCELLED"

const STATUS_VARIANTS: Record<OrderStatus, "secondary" | "default" | "destructive"> = {
  DRAFT: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
}

type OrderRow = {
  id: string
  number: string
  createdAt: string
  status: OrderStatus
  total: number
  table: { number: number; floor: { name: string } } | null
  customer: { name: string } | null
  createdBy: { name: string } | null
}

export function OrdersTable({
  basePath,
  showEmployee = false,
  fixedParams,
  employees,
  sessions,
  hideDateFilter = false,
}: {
  basePath: string
  showEmployee?: boolean
  fixedParams?: Record<string, string>
  employees?: { id: string; name: string }[]
  sessions?: { id: string; openedAt: string; openedBy: { name: string } }[]
  hideDateFilter?: boolean
}) {
  const router = useRouter()
  const [orders, setOrders] = React.useState<OrderRow[]>([])
  const [total, setTotal] = React.useState(0)
  const [loading, setLoading] = React.useState(true)
  const [q, setQ] = React.useState("")
  const [status, setStatus] = React.useState(ALL)
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(undefined)
  const [employeeId, setEmployeeId] = React.useState(ALL)
  const [sessionId, setSessionId] = React.useState(ALL)
  const [page, setPage] = React.useState(1)

  const from = dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : ""
  const to = dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : ""

  React.useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({ ...fixedParams, page: String(page), pageSize: String(PAGE_SIZE) })
    if (q.trim()) params.set("q", q.trim())
    if (status !== ALL) params.set("status", status)
    if (from) params.set("from", from)
    if (to) params.set("to", to)
    if (employeeId !== ALL) params.set("employeeId", employeeId)
    if (sessionId !== ALL) params.set("sessionId", sessionId)

    fetch(`/api/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { orders: OrderRow[]; total: number }) => {
        setOrders(data.orders)
        setTotal(data.total)
      })
      .finally(() => setLoading(false))
  }, [q, status, from, to, employeeId, sessionId, page, fixedParams])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const columnCount = showEmployee ? 7 : 6

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search order # or customer..."
            className="pl-8"
            value={q}
            onChange={(e) => {
              setPage(1)
              setQ(e.target.value)
            }}
          />
        </div>

        <Select
          value={status}
          onValueChange={(value) => {
            setPage(1)
            setStatus(value)
          }}
        >
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {hideDateFilter ? null : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn("justify-start text-left font-normal", !dateRange?.from && "text-muted-foreground")}
              >
                <CalendarIcon />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "dd MMM yyyy")} - {format(dateRange.to, "dd MMM yyyy")}
                    </>
                  ) : (
                    format(dateRange.from, "dd MMM yyyy")
                  )
                ) : (
                  "Date range"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => {
                  setPage(1)
                  setDateRange(range)
                }}
                numberOfMonths={1}
              />
              {dateRange ? (
                <div className="border-t p-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setPage(1)
                      setDateRange(undefined)
                    }}
                  >
                    Clear
                  </Button>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        )}

        {employees ? (
          <Select
            value={employeeId}
            onValueChange={(value) => {
              setPage(1)
              setEmployeeId(value)
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All employees</SelectItem>
              {employees.map((employee) => (
                <SelectItem key={employee.id} value={employee.id}>
                  {employee.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}

        {sessions ? (
          <Select
            value={sessionId}
            onValueChange={(value) => {
              setPage(1)
              setSessionId(value)
            }}
          >
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All sessions</SelectItem>
              {sessions.map((session) => (
                <SelectItem key={session.id} value={session.id}>
                  {new Date(session.openedAt).toLocaleString("en-IN")} · {session.openedBy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Table</TableHead>
            <TableHead>Customer</TableHead>
            {showEmployee ? <TableHead>Employee</TableHead> : null}
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} className="h-24 text-center text-muted-foreground">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => router.push(`${basePath}/${order.id}`)}
              >
                <TableCell className="font-medium">
                  <Link href={`${basePath}/${order.id}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                    {order.number}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(order.createdAt).toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-muted-foreground">
                  {order.table ? `Table ${order.table.number} · ${order.table.floor.name}` : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">{order.customer?.name ?? "—"}</TableCell>
                {showEmployee ? (
                  <TableCell className="text-muted-foreground">{order.createdBy?.name ?? "—"}</TableCell>
                ) : null}
                <TableCell className="text-right">{currency.format(order.total)}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page > 1) setPage(page - 1)
                }}
                className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-2 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (page < totalPages) setPage(page + 1)
                }}
                className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      ) : null}
    </div>
  )
}
