import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { currency } from "@/lib/format"

export type RecentOrderRow = {
  id: string
  number: string
  paidAt: string | null
  total: number
  paymentType: string | null
  table: { number: number; floor: { name: string } } | null
  customer: { name: string } | null
  paidBy: { name: string } | null
}

export function RecentOrdersTable({ orders }: { orders: RecentOrderRow[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-base font-medium">Recent Orders</CardTitle>
        <Link href="/admin/orders" className="text-sm text-muted-foreground hover:underline">
          View all
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Table</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Employee</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No paid orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                      {order.number}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.paidAt
                      ? new Date(order.paidAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      : "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {order.table ? `Table ${order.table.number} · ${order.table.floor.name}` : "Takeaway"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{order.customer?.name ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{order.paidBy?.name ?? "—"}</TableCell>
                  <TableCell className="text-right">{currency.format(order.total)}</TableCell>
                  <TableCell>{order.paymentType ? <Badge variant="outline">{order.paymentType}</Badge> : "—"}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
