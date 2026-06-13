"use client"

import * as React from "react"

import { MoreHorizontal, Plus, Search } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

import { CustomerFormDialog, type CustomerRecord } from "@/components/admin/customer-form-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

type CustomerWithCount = CustomerRecord & { _count: { orders: number }; createdAt: string }

export function CustomersView({ initialCustomers }: { initialCustomers: CustomerWithCount[] }) {
  const [customers, setCustomers] = React.useState(initialCustomers)
  const [editing, setEditing] = React.useState<CustomerWithCount | null>(null)
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return customers

    return customers.filter(
      (customer) =>
        customer.name.toLowerCase().includes(term) ||
        customer.email?.toLowerCase().includes(term) ||
        customer.phone?.toLowerCase().includes(term),
    )
  }, [customers, search])

  const handleDelete = async (customer: CustomerWithCount) => {
    if (!confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete customer."))
      return
    }

    setCustomers((prev) => prev.filter((c) => c.id !== customer.id))
    toast.success("Customer deleted.")
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Customers</CardTitle>
        <CardDescription>Manage customer profiles and review their order history.</CardDescription>
        <CardAction>
          <CustomerFormDialog
            trigger={
              <Button size="sm">
                <Plus /> Add customer
              </Button>
            }
            onSaved={(saved) =>
              setCustomers((prev) =>
                [...prev, { ...saved, _count: { orders: 0 }, createdAt: new Date().toISOString() }].sort((a, b) =>
                  a.name.localeCompare(b.name),
                ),
              )
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="relative mb-4 max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or phone..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Customer since</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {customers.length === 0 ? "No customers yet." : "No customers match your search."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/customers/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{customer.email ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.phone ?? "—"}</TableCell>
                  <TableCell>{customer._count.orders}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${customer.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/customers/${customer.id}`}>View details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setEditing(customer)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(customer)}>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>

      {editing ? (
        <CustomerFormDialog
          customer={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={(saved) => {
            setCustomers((prev) => prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)))
            setEditing(null)
          }}
        />
      ) : null}
    </Card>
  )
}
