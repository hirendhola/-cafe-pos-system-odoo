"use client"

import * as React from "react"

import QRCode from "qrcode"
import { toast } from "sonner"

import type { ReceiptOrder } from "@/components/pos/receipt-view"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

type PaymentMethodType = "CASH" | "CARD" | "UPI"
type PaymentMethodRecord = { type: PaymentMethodType; enabled: boolean; upiId: string | null }

const METHOD_LABELS: Record<PaymentMethodType, string> = { CASH: "Cash", CARD: "Card", UPI: "UPI" }

export function PaymentDialog({
  open,
  onOpenChange,
  order,
  onPaid,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  order: { id: string; number: string; total: number }
  onPaid: (order: ReceiptOrder) => void
}) {
  const [methods, setMethods] = React.useState<PaymentMethodRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [submitting, setSubmitting] = React.useState(false)
  const [activeTab, setActiveTab] = React.useState<PaymentMethodType>("CASH")
  const [amountTendered, setAmountTendered] = React.useState("")
  const [cardRef, setCardRef] = React.useState("")
  const [upiRef, setUpiRef] = React.useState("")
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null)

  const enabledMethods = methods.filter((m) => m.enabled)
  const upiMethod = methods.find((m) => m.type === "UPI")

  React.useEffect(() => {
    if (!open) return

    setAmountTendered("")
    setCardRef("")
    setUpiRef("")
    setQrDataUrl(null)
    setLoading(true)

    fetch("/api/payment-methods")
      .then((res) => res.json())
      .then((data: PaymentMethodRecord[]) => {
        setMethods(data)
        const firstEnabled = data.find((m) => m.enabled)
        if (firstEnabled) setActiveTab(firstEnabled.type)
      })
      .finally(() => setLoading(false))
  }, [open])

  React.useEffect(() => {
    if (activeTab !== "UPI" || !upiMethod?.upiId) {
      setQrDataUrl(null)
      return
    }

    let cancelled = false
    const amount = order.total.toFixed(2)
    QRCode.toDataURL(
      `upi://pay?pa=${encodeURIComponent(upiMethod.upiId)}&pn=Cafe%20POS&am=${amount}&tn=${encodeURIComponent(order.number)}&cu=INR`,
      { width: 220 },
    ).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })

    return () => {
      cancelled = true
    }
  }, [activeTab, upiMethod?.upiId, order.total, order.number])

  const tendered = Number(amountTendered)
  const changeDue = Math.max(0, (Number.isFinite(tendered) ? tendered : 0) - order.total)

  const quickAmounts = React.useMemo(() => {
    const total = order.total
    const amounts = new Set<number>()
    amounts.add(Math.ceil(total))
    for (const step of [50, 100, 500, 1000]) {
      const rounded = Math.ceil(total / step) * step
      if (rounded > total) amounts.add(rounded)
    }
    return Array.from(amounts)
      .sort((a, b) => a - b)
      .slice(0, 4)
  }, [order.total])

  const handleConfirm = async (paymentType: PaymentMethodType) => {
    const body: Record<string, unknown> = { paymentType }

    if (paymentType === "CASH") {
      body.amountTendered = tendered
    } else if (paymentType === "CARD") {
      body.paymentRef = cardRef.trim()
    } else if (upiRef.trim()) {
      body.paymentRef = upiRef.trim()
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to record payment."))
        return
      }

      onOpenChange(false)
      onPaid(data as ReceiptOrder)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Take payment</DialogTitle>
          <DialogDescription>
            Order {order.number} &middot; Total due {currency.format(order.total)}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading payment methods...</p>
        ) : enabledMethods.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No payment methods are enabled. Ask an admin to enable one under Payment Methods.
          </p>
        ) : (
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PaymentMethodType)}>
            <TabsList className="w-full">
              {enabledMethods.map((method) => (
                <TabsTrigger key={method.type} value={method.type}>
                  {METHOD_LABELS[method.type]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="CASH" className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="amount-tendered">Amount received</Label>
                <Input
                  id="amount-tendered"
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder={order.total.toFixed(2)}
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {quickAmounts.map((amount) => (
                  <Button
                    key={amount}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setAmountTendered(String(amount))}
                  >
                    {currency.format(amount)}
                  </Button>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
                <span className="text-muted-foreground">Change due</span>
                <span className="font-semibold">{currency.format(changeDue)}</span>
              </div>
              <Button
                disabled={submitting || !amountTendered || tendered < order.total}
                onClick={() => handleConfirm("CASH")}
              >
                Confirm cash payment
              </Button>
            </TabsContent>

            <TabsContent value="CARD" className="flex flex-col gap-3 pt-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="card-ref">Transaction reference</Label>
                <Input
                  id="card-ref"
                  placeholder="e.g. last 4 digits or auth code"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                />
              </div>
              <Button disabled={submitting || !cardRef.trim()} onClick={() => handleConfirm("CARD")}>
                Confirm card payment
              </Button>
            </TabsContent>

            <TabsContent value="UPI" className="flex flex-col gap-3 pt-2">
              {upiMethod?.upiId ? (
                qrDataUrl ? (
                  <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="UPI QR code" className="size-48" />
                    <span className="text-sm font-medium">{currency.format(order.total)}</span>
                    <span className="text-xs text-muted-foreground">
                      Scan with any UPI app to pay {upiMethod.upiId}
                    </span>
                  </div>
                ) : null
              ) : (
                <p className="text-sm text-muted-foreground">
                  No UPI ID configured. Ask an admin to set one under Payment Methods.
                </p>
              )}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="upi-ref">Reference (optional)</Label>
                <Input
                  id="upi-ref"
                  placeholder="UPI transaction ID"
                  value={upiRef}
                  onChange={(e) => setUpiRef(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button className="flex-1" disabled={submitting} onClick={() => handleConfirm("UPI")}>
                  Confirmed
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
