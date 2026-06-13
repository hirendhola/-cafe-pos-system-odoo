"use client"

import * as React from "react"

import { ArrowDownRight, ArrowUpRight, CheckCircle2 } from "lucide-react"

import { CloseoutReportView } from "@/components/admin/closeout-report-view"
import { ExportMenu } from "@/components/admin/export-menu"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { CsvColumn } from "@/lib/csv"
import { currency, number } from "@/lib/format"
import { cn } from "@/lib/utils"

type SessionRow = {
  id: string
  openedAt: string
  closedAt: string | null
  openedBy: string
  closedBy: string | null
  openingAmount: number
  closingAmount: number | null
  expectedCash: number
  variance: number | null
  cashSales: number
  cardSales: number
  upiSales: number
  ordersCount: number
  netSales: number
  totalRevenue: number
}

function VarianceCell({ variance }: { variance: number | null }) {
  if (variance === null) return <span className="text-muted-foreground">—</span>

  if (variance === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-emerald-600">
        <CheckCircle2 className="size-3.5" /> Matches
      </span>
    )
  }

  const isOver = variance > 0

  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap", isOver ? "text-emerald-600" : "text-destructive")}>
      {isOver ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
      {currency.format(Math.abs(variance))} {isOver ? "over" : "short"}
    </span>
  )
}

export function SessionsReport() {
  const [sessions, setSessions] = React.useState<SessionRow[] | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [openSessionId, setOpenSessionId] = React.useState<string | null>(null)

  React.useEffect(() => {
    fetch("/api/sessions?all=true")
      .then((res) => res.json())
      .then((json: SessionRow[]) => setSessions(json))
      .finally(() => setLoading(false))
  }, [])

  const exportColumns: CsvColumn<SessionRow>[] = [
    { key: "openedAt", label: "Opened At", format: (row) => new Date(row.openedAt).toLocaleString("en-IN") },
    { key: "openedBy", label: "Opened By" },
    {
      key: "closedAt",
      label: "Closed At",
      format: (row) => (row.closedAt ? new Date(row.closedAt).toLocaleString("en-IN") : ""),
    },
    { key: "closedBy", label: "Closed By", format: (row) => row.closedBy ?? "" },
    { key: "openingAmount", label: "Opening Amount", format: (row) => row.openingAmount.toFixed(2) },
    {
      key: "closingAmount",
      label: "Closing Amount",
      format: (row) => (row.closingAmount !== null ? row.closingAmount.toFixed(2) : ""),
    },
    { key: "expectedCash", label: "Expected Cash", format: (row) => row.expectedCash.toFixed(2) },
    { key: "variance", label: "Variance", format: (row) => (row.variance !== null ? row.variance.toFixed(2) : "") },
    { key: "cashSales", label: "Cash Sales", format: (row) => row.cashSales.toFixed(2) },
    { key: "cardSales", label: "Card Sales", format: (row) => row.cardSales.toFixed(2) },
    { key: "upiSales", label: "UPI Sales", format: (row) => row.upiSales.toFixed(2) },
    { key: "ordersCount", label: "Orders" },
    { key: "totalRevenue", label: "Total Revenue", format: (row) => row.totalRevenue.toFixed(2) },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">Most recent 50 sessions, newest first.</p>
        <ExportMenu data={sessions} columns={exportColumns} filename={`sessions-${new Date().toISOString().slice(0, 10)}`} sheetName="Sessions" />
      </div>

      {loading || !sessions ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opened</TableHead>
              <TableHead>Opened By</TableHead>
              <TableHead>Closed</TableHead>
              <TableHead>Closed By</TableHead>
              <TableHead className="text-right">Opening</TableHead>
              <TableHead className="text-right">Closing</TableHead>
              <TableHead className="text-right">Expected</TableHead>
              <TableHead>Variance</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Card</TableHead>
              <TableHead className="text-right">UPI</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="h-24 text-center text-muted-foreground">
                  No sessions yet.
                </TableCell>
              </TableRow>
            ) : (
              sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="text-muted-foreground">{new Date(session.openedAt).toLocaleString("en-IN")}</TableCell>
                  <TableCell>{session.openedBy}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {session.closedAt ? (
                      new Date(session.closedAt).toLocaleString("en-IN")
                    ) : (
                      <Badge variant="secondary">Open</Badge>
                    )}
                  </TableCell>
                  <TableCell>{session.closedBy ?? "—"}</TableCell>
                  <TableCell className="text-right">{currency.format(session.openingAmount)}</TableCell>
                  <TableCell className="text-right">
                    {session.closingAmount !== null ? currency.format(session.closingAmount) : "—"}
                  </TableCell>
                  <TableCell className="text-right">{currency.format(session.expectedCash)}</TableCell>
                  <TableCell>
                    <VarianceCell variance={session.variance} />
                  </TableCell>
                  <TableCell className="text-right">{currency.format(session.cashSales)}</TableCell>
                  <TableCell className="text-right">{currency.format(session.cardSales)}</TableCell>
                  <TableCell className="text-right">{currency.format(session.upiSales)}</TableCell>
                  <TableCell className="text-right">{number.format(session.ordersCount)}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => setOpenSessionId(session.id)}>
                      Close-out Report
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={!!openSessionId} onOpenChange={(open) => !open && setOpenSessionId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogTitle className="sr-only">Daily Close-out Report</DialogTitle>
          {openSessionId ? <CloseoutReportView sessionId={openSessionId} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
