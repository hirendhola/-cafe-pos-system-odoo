"use client"

import * as React from "react"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { extractErrorMessage } from "@/lib/form-error"

export function DiscountDialog({
  open,
  onOpenChange,
  orderId,
  appliedCode,
  onChanged,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
  appliedCode: string | null
  onChanged: () => void
}) {
  const [code, setCode] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)

  React.useEffect(() => {
    if (open) setCode("")
  }, [open])

  const handleApply = async () => {
    if (!code.trim()) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/coupon`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to apply coupon."))
        return
      }

      toast.success(`Coupon ${data.coupon.code} applied.`)
      setCode("")
      onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  const handleRemove = async () => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/orders/${orderId}/coupon`, { method: "DELETE" })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to remove coupon."))
        return
      }

      toast.success("Coupon removed.")
      onChanged()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apply discount</DialogTitle>
          <DialogDescription>
            Enter a coupon code to apply it to this order. Active promotions are applied automatically.
          </DialogDescription>
        </DialogHeader>

        {appliedCode ? (
          <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <span>
              Coupon <span className="font-mono font-medium">{appliedCode}</span> applied
            </span>
            <Button size="sm" variant="ghost" disabled={submitting} onClick={handleRemove}>
              Remove
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="coupon-code-input">Coupon code</Label>
            <div className="flex gap-2">
              <Input
                id="coupon-code-input"
                placeholder="e.g. WELCOME10"
                className="font-mono uppercase"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
              <Button disabled={submitting || !code.trim()} onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
