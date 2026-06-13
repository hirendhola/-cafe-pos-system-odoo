"use client"

import * as React from "react"

import { Mail, Printer } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

export type ReceiptOrder = {
  id: string
  number: string
  status: string
  createdAt: string | Date
  paidAt?: string | Date | null
  subtotal: number
  tax: number
  discount: number
  total: number
  paymentType?: string | null
  paymentRef?: string | null
  amountTendered?: number | null
  changeDue?: number | null
  table?: { number: number; floor: { name: string } } | null
  customer?: { name: string; email: string | null } | null
  items: { id: string; qty: number; unitPrice: number; lineDiscount: number; product: { name: string } }[]
}

export function ReceiptView({ order }: { order: ReceiptOrder }) {
  const [emailing, setEmailing] = React.useState(false)

  const handlePrint = () => window.print()

  const handleEmail = async () => {
    setEmailing(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/receipt/email`, { method: "POST" })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to email receipt."))
        return
      }

      toast.success(`Receipt emailed to ${order.customer?.email}.`)
    } finally {
      setEmailing(false)
    }
  }

  const date = new Date(order.paidAt ?? order.createdAt)

  return (
    <div className="flex flex-col gap-4">
      <div id="receipt-print-area" className="flex flex-col gap-3 rounded-lg border p-4">
        <div className="text-center">
          <div className="text-lg font-semibold">Cafe POS</div>
          <div className="text-sm text-muted-foreground">Order {order.number}</div>
          <div className="text-xs text-muted-foreground">{date.toLocaleString("en-IN")}</div>
          {order.table ? (
            <div className="text-xs text-muted-foreground">
              Table {order.table.number} &middot; {order.table.floor.name}
            </div>
          ) : null}
          {order.customer ? <div className="text-xs text-muted-foreground">{order.customer.name}</div> : null}
        </div>

        <Separator />

        <ul className="flex flex-col gap-1 text-sm">
          {order.items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-2">
              <span>
                {item.qty} x {item.product.name}
              </span>
              <span>{currency.format(item.unitPrice * item.qty - item.lineDiscount)}</span>
            </li>
          ))}
        </ul>

        <Separator />

        <div className="flex flex-col gap-1 text-sm">
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
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{currency.format(order.total)}</span>
          </div>
        </div>

        {order.paymentType ? (
          <>
            <Separator />
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paid via</span>
                <Badge variant="outline">{order.paymentType}</Badge>
              </div>
              {order.paymentRef ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Reference</span>
                  <span>{order.paymentRef}</span>
                </div>
              ) : null}
              {order.amountTendered != null ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Amount received</span>
                  <span>{currency.format(order.amountTendered)}</span>
                </div>
              ) : null}
              {order.changeDue != null ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Change due</span>
                  <span>{currency.format(order.changeDue)}</span>
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      <div className="flex gap-2 print:hidden">
        <Button variant="outline" className="flex-1" onClick={handlePrint}>
          <Printer /> Print receipt
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          disabled={!order.customer?.email || emailing}
          title={order.customer?.email ? undefined : "Add a customer with an email to send a receipt"}
          onClick={handleEmail}
        >
          <Mail /> {emailing ? "Sending..." : "Email receipt"}
        </Button>
      </div>
    </div>
  )
}
