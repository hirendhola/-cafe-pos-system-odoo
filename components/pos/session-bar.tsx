"use client"

import * as React from "react"

import { useRouter } from "next/navigation"

import { Wallet } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

type SessionRecord = {
  id: string
  openedAt: string
  openingAmount: number
}

type ClosingSummary = {
  openingAmount: number
  closingAmount: number
  expectedCash: number
  variance: number
  cashSales: number
  cardSales: number
  upiSales: number
  ordersCount: number
  grandTotal: number
}

function SummaryRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={emphasize ? "font-semibold text-destructive" : "font-medium"}>{value}</span>
    </div>
  )
}

export function SessionBar() {
  const router = useRouter()
  const [current, setCurrent] = React.useState<SessionRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [openDialogOpen, setOpenDialogOpen] = React.useState(false)
  const [closeDialogOpen, setCloseDialogOpen] = React.useState(false)
  const [openingAmount, setOpeningAmount] = React.useState("0")
  const [closingAmount, setClosingAmount] = React.useState("")
  const [submitting, setSubmitting] = React.useState(false)
  const [summary, setSummary] = React.useState<ClosingSummary | null>(null)

  const fetchSession = React.useCallback(() => {
    return fetch("/api/sessions")
      .then((res) => res.json())
      .then((data: { current: SessionRecord | null }) => setCurrent(data.current))
      .finally(() => setLoading(false))
  }, [])

  React.useEffect(() => {
    fetchSession()
  }, [fetchSession])

  const handleOpen = async () => {
    setSubmitting(true)
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openingAmount: Number(openingAmount) || 0 }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to open session."))
        return
      }

      setOpenDialogOpen(false)
      setOpeningAmount("0")
      toast.success("Session opened.")
      await fetchSession()
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = async () => {
    if (!current) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/sessions/${current.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ closingAmount: Number(closingAmount) || 0 }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to close session."))
        return
      }

      setCloseDialogOpen(false)
      setClosingAmount("")
      setSummary(data.summary)
      setCurrent(null)
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return null

  return (
    <>
      {current ? (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1">
            <Wallet className="size-3.5" />
            Session open since{" "}
            {new Date(current.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => setCloseDialogOpen(true)}>
            Close Session
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={() => setOpenDialogOpen(true)}>
          <Wallet /> Open Session
        </Button>
      )}

      <Dialog open={openDialogOpen} onOpenChange={setOpenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Open session</DialogTitle>
            <DialogDescription>Enter the starting cash amount in the drawer.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="opening-amount">Opening cash amount</Label>
            <Input
              id="opening-amount"
              type="number"
              min={0}
              step="0.01"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpenDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleOpen} disabled={submitting}>
              Open session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close session</DialogTitle>
            <DialogDescription>Count the cash drawer and enter the closing amount.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="closing-amount">Closing cash amount</Label>
            <Input
              id="closing-amount"
              type="number"
              min={0}
              step="0.01"
              placeholder="0.00"
              value={closingAmount}
              onChange={(e) => setClosingAmount(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCloseDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={submitting || !closingAmount}>
              Close session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!summary} onOpenChange={(open) => !open && setSummary(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session closed</DialogTitle>
            <DialogDescription>Summary of this session&apos;s activity.</DialogDescription>
          </DialogHeader>
          {summary ? (
            <div className="flex flex-col gap-2 text-sm">
              <SummaryRow label="Opening cash" value={currency.format(summary.openingAmount)} />
              <SummaryRow label="Cash sales" value={currency.format(summary.cashSales)} />
              <SummaryRow label="Card sales" value={currency.format(summary.cardSales)} />
              <SummaryRow label="UPI sales" value={currency.format(summary.upiSales)} />
              <Separator />
              <SummaryRow label="Orders" value={String(summary.ordersCount)} />
              <SummaryRow label="Grand total" value={currency.format(summary.grandTotal)} />
              <Separator />
              <SummaryRow label="Expected cash" value={currency.format(summary.expectedCash)} />
              <SummaryRow label="Closing cash (counted)" value={currency.format(summary.closingAmount)} />
              <SummaryRow
                label="Variance"
                value={currency.format(summary.variance)}
                emphasize={summary.variance !== 0}
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={() => setSummary(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
