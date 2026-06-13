"use client"

import * as React from "react"

import { useRouter } from "next/navigation"
import Link from "next/link"

import { ArrowLeft, Mail, Pencil, Phone, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { CustomerFormDialog, type CustomerRecord } from "@/components/admin/customer-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

type OrderStatus = "DRAFT" | "PAID" | "CANCELLED"

const STATUS_LABELS: Record<OrderStatus, string> = {
  DRAFT: "Draft",
  PAID: "Paid",
  CANCELLED: "Cancelled",
}

const STATUS_VARIANTS: Record<OrderStatus, "default" | "secondary" | "destructive" | "outline"> = {
  DRAFT: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
}

type OrderSummary = {
  id: string
  number: string
  status: OrderStatus
  total: number
  createdAt: string
  table: { number: number; floorName: string } | null
}

type CustomerWithDate = CustomerRecord & { createdAt: string }

export function CustomerDetailView({ customer, orders }: { customer: CustomerWithDate; orders: OrderSummary[] }) {
  const router = useRouter()
  const [current, setCurrent] = React.useState(customer)
  const [editing, setEditing] = React.useState(false)

  const paidOrders = orders.filter((order) => order.status === "PAID")
  const totalSpent = paidOrders.reduce((sum, order) => sum + order.total, 0)

  const handleDelete = async () => {
    if (!confirm(`Delete customer "${current.name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/customers/${current.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete customer."))
      return
    }

    toast.success("Customer deleted.")
    router.push("/admin/customers")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" asChild>
          <Link href="/admin/customers" aria-label="Back to customers">
            <ArrowLeft />
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold">{current.name}</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle>Customer details</CardTitle>
              <CardDescription>Customer since {new Date(current.createdAt).toLocaleDateString()}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 /> Delete
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="size-4 text-muted-foreground" />
              {current.email ? (
                <a href={`mailto:${current.email}`} className="hover:underline">
                  {current.email}
                </a>
              ) : (
                <span className="text-muted-foreground">No email on file</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {current.phone ? (
                <a href={`tel:${current.phone}`} className="hover:underline">
                  {current.phone}
                </a>
              ) : (
                <span className="text-muted-foreground">No phone on file</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lifetime stats</CardTitle>
            <CardDescription>Across all orders linked to this customer.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="text-2xl font-semibold">{orders.length}</div>
              <div className="text-xs text-muted-foreground">Total orders</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{currency.format(totalSpent)}</div>
              <div className="text-xs text-muted-foreground">Total spent ({paidOrders.length} paid orders)</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Order history</CardTitle>
          <CardDescription>All orders placed by this customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No orders yet.
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.number}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.table ? `${order.table.floorName} · Table ${order.table.number}` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[order.status]}>{STATUS_LABELS[order.status]}</Badge>
                    </TableCell>
                    <TableCell>{currency.format(order.total)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(order.createdAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {editing ? (
        <CustomerFormDialog
          customer={current}
          open={editing}
          onOpenChange={setEditing}
          onSaved={(saved) => {
            setCurrent((prev) => ({ ...prev, ...saved }))
            setEditing(false)
          }}
        />
      ) : null}
    </div>
  )
}
