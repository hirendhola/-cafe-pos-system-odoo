"use client"

import * as React from "react"

import Link from "next/link"
import { useRouter } from "next/navigation"

import { ArrowLeft, Ban, Minus, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { ReceiptView } from "@/components/pos/receipt-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

type OrderStatus = "DRAFT" | "PAID" | "CANCELLED"
type KdsStatus = "TO_COOK" | "PREPARING" | "COMPLETED"

const STATUS_VARIANTS: Record<OrderStatus, "secondary" | "default" | "destructive"> = {
  DRAFT: "secondary",
  PAID: "default",
  CANCELLED: "destructive",
}

const KDS_LABELS: Record<KdsStatus, string> = {
  TO_COOK: "To cook",
  PREPARING: "Preparing",
  COMPLETED: "Completed",
}

export type OrderDetailRecord = {
  id: string
  number: string
  status: OrderStatus
  createdAt: string | Date
  paidAt?: string | Date | null
  cancelledAt?: string | Date | null
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentType?: string | null
  paymentRef?: string | null
  amountTendered?: number | null
  changeDue?: number | null
  tableId: string | null
  table?: { number: number; floor: { name: string } } | null
  customer?: { name: string; email: string | null; phone?: string | null } | null
  createdBy?: { name: string } | null
  paidBy?: { name: string } | null
  items: {
    id: string
    qty: number
    unitPrice: number
    lineDiscount: number
    kdsStatus: KdsStatus
    product: { id: string; name: string }
  }[]
}

export function OrderDetailView({
  order: initialOrder,
  basePath,
  editable,
  showAudit = false,
  showCancelAction = false,
}: {
  order: OrderDetailRecord
  basePath: string
  editable: boolean
  showAudit?: boolean
  showCancelAction?: boolean
}) {
  const router = useRouter()
  const [order, setOrder] = React.useState(initialOrder)
  const [busyItemId, setBusyItemId] = React.useState<string | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [cancelling, setCancelling] = React.useState(false)

  const updateItemQty = async (itemId: string, qty: number) => {
    setBusyItemId(itemId)
    try {
      const res = await fetch(`/api/order-items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qty }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to update item."))
        return
      }

      setOrder(data)
    } finally {
      setBusyItemId(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setBusyItemId(itemId)
    try {
      const res = await fetch(`/api/order-items/${itemId}`, { method: "DELETE" })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to remove item."))
        return
      }

      setOrder(data)
    } finally {
      setBusyItemId(null)
    }
  }

  const decrementItem = (item: OrderDetailRecord["items"][number]) => {
    if (item.qty <= 1) {
      void removeItem(item.id)
    } else {
      void updateItemQty(item.id, item.qty - 1)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(`Delete order ${order.number}? This cannot be undone.`)) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: "DELETE" })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to delete order."))
        return
      }

      toast.success("Order deleted.")
      router.push(basePath)
      router.refresh()
    } finally {
      setDeleting(false)
    }
  }

  const handleCancel = async () => {
    if (!window.confirm(`Cancel order ${order.number}? This cannot be undone.`)) return

    setCancelling(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to cancel order."))
        return
      }

      setOrder(data)
      toast.success("Order cancelled.")
      router.refresh()
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" asChild>
          <Link href={basePath}>
            <ArrowLeft /> Back to orders
          </Link>
        </Button>
        <Badge variant={STATUS_VARIANTS[order.status]}>{order.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order {order.number}</CardTitle>
          <CardDescription>{new Date(order.createdAt).toLocaleString("en-IN")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <div className="text-muted-foreground">Table</div>
            <div>{order.table ? `Table ${order.table.number} · ${order.table.floor.name}` : "—"}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Customer</div>
            <div>{order.customer?.name ?? "—"}</div>
          </div>
          {showAudit ? (
            <>
              <div>
                <div className="text-muted-foreground">Created by</div>
                <div>{order.createdBy?.name ?? "—"}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Paid by</div>
                <div>
                  {order.paidBy && order.paidAt
                    ? `${order.paidBy.name} · ${new Date(order.paidAt).toLocaleString("en-IN")}`
                    : "—"}
                </div>
              </div>
            </>
          ) : null}
          {order.cancelledAt ? (
            <div>
              <div className="text-muted-foreground">Cancelled at</div>
              <div>{new Date(order.cancelledAt).toLocaleString("en-IN")}</div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-right">Line total</TableHead>
                {editable ? <TableHead className="w-10" /> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {KDS_LABELS[item.kdsStatus]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {editable ? (
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={busyItemId === item.id}
                          onClick={() => decrementItem(item)}
                        >
                          <Minus />
                        </Button>
                        <span className="w-6 text-center">{item.qty}</span>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          disabled={busyItemId === item.id}
                          onClick={() => updateItemQty(item.id, item.qty + 1)}
                        >
                          <Plus />
                        </Button>
                      </div>
                    ) : (
                      item.qty
                    )}
                  </TableCell>
                  <TableCell className="text-right">{currency.format(item.unitPrice)}</TableCell>
                  <TableCell className="text-right">
                    {currency.format(item.unitPrice * item.qty - item.lineDiscount)}
                  </TableCell>
                  {editable ? (
                    <TableCell>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        disabled={busyItemId === item.id}
                        onClick={() => void removeItem(item.id)}
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Totals</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-1 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{currency.format(order.subtotal)}</span>
          </div>
          {order.discount > 0 ? (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span>-{currency.format(order.discount)}</span>
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Tax</span>
            <span>{currency.format(order.tax)}</span>
          </div>
          <Separator className="my-1" />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{currency.format(order.total)}</span>
          </div>
        </CardContent>
      </Card>

      {order.status === "DRAFT" ? (
        <div className="flex gap-2">
          {order.tableId ? (
            <Button onClick={() => router.push(`/?table=${order.tableId}`)}>
              <Pencil /> Edit Order
            </Button>
          ) : null}
          <Button variant="destructive" disabled={deleting} onClick={handleDelete}>
            <Trash2 /> {deleting ? "Deleting..." : "Delete Order"}
          </Button>
        </div>
      ) : null}

      {order.paymentType ? (
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptView order={order} />
          </CardContent>
        </Card>
      ) : null}

      {order.status === "PAID" && showCancelAction ? (
        <Button variant="destructive" disabled={cancelling} onClick={handleCancel}>
          <Ban /> {cancelling ? "Cancelling..." : "Cancel Order"}
        </Button>
      ) : null}
    </div>
  )
}
