"use client"

import * as React from "react"

import QRCode from "qrcode"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { extractErrorMessage } from "@/lib/form-error"

type PaymentMethodType = "CASH" | "CARD" | "UPI"

type PaymentMethodRecord = {
  id: string
  type: PaymentMethodType
  enabled: boolean
  upiId: string | null
}

const LABELS: Record<PaymentMethodType, { title: string; description: string }> = {
  CASH: { title: "Cash", description: "Available at checkout when enabled." },
  CARD: { title: "Card", description: "Represents card and bank payments." },
  UPI: { title: "UPI QR", description: "Generates a QR code from the saved UPI ID at the payment screen." },
}

export function PaymentMethodsView({ initialMethods }: { initialMethods: PaymentMethodRecord[] }) {
  const [methods, setMethods] = React.useState(initialMethods)
  const [upiDraft, setUpiDraft] = React.useState(initialMethods.find((m) => m.type === "UPI")?.upiId ?? "")
  const [qrDataUrl, setQrDataUrl] = React.useState<string | null>(null)
  const [savingUpi, setSavingUpi] = React.useState(false)
  const [togglingType, setTogglingType] = React.useState<PaymentMethodType | null>(null)

  const upiMethod = methods.find((m) => m.type === "UPI")

  React.useEffect(() => {
    const value = upiMethod?.upiId
    if (!value) {
      setQrDataUrl(null)
      return
    }

    let cancelled = false
    QRCode.toDataURL(`upi://pay?pa=${encodeURIComponent(value)}&pn=Cafe%20POS&cu=INR`, { width: 200 }).then((url) => {
      if (!cancelled) setQrDataUrl(url)
    })

    return () => {
      cancelled = true
    }
  }, [upiMethod?.upiId])

  const handleToggle = async (type: PaymentMethodType, enabled: boolean) => {
    setTogglingType(type)
    try {
      const res = await fetch(`/api/payment-methods/${type}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to update payment method."))
        return
      }

      setMethods((prev) => prev.map((m) => (m.type === type ? data : m)))
    } finally {
      setTogglingType(null)
    }
  }

  const handleSaveUpi = async () => {
    setSavingUpi(true)
    try {
      const res = await fetch(`/api/payment-methods/UPI`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ upiId: upiDraft.trim() || null }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to update UPI ID."))
        return
      }

      setMethods((prev) => prev.map((m) => (m.type === "UPI" ? data : m)))
      toast.success("UPI ID saved.")
    } finally {
      setSavingUpi(false)
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {methods.map((method) => (
        <Card key={method.id}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>{LABELS[method.type].title}</CardTitle>
              <Switch
                checked={method.enabled}
                disabled={togglingType === method.type}
                onCheckedChange={(checked) => handleToggle(method.type, checked)}
              />
            </div>
            <CardDescription>{LABELS[method.type].description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Badge variant={method.enabled ? "default" : "secondary"}>
                {method.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            {method.type === "UPI" ? (
              <>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <div className="flex gap-2">
                    <Input
                      id="upi-id"
                      placeholder="e.g. cafe@ybl"
                      value={upiDraft}
                      onChange={(e) => setUpiDraft(e.target.value)}
                    />
                    <Button onClick={handleSaveUpi} disabled={savingUpi}>
                      Save
                    </Button>
                  </div>
                </div>

                {qrDataUrl ? (
                  <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrDataUrl} alt="UPI QR code" className="size-40" />
                    <span className="text-xs text-muted-foreground">Preview — shown to customers at checkout</span>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Save a UPI ID to preview its QR code.</p>
                )}
              </>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
