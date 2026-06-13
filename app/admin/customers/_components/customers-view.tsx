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
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

const PAGE_SIZE = 20

type CustomerWithCount = CustomerRecord & { _count: { orders: number }; createdAt: string }

export function CustomersView({
  initialCustomers,
  initialCustomersTotal,
}: {
  initialCustomers: CustomerWithCount[]
  initialCustomersTotal: number
}) {
  const [customers, setCustomers] = React.useState(initialCustomers)
  const [total, setTotal] = React.useState(initialCustomersTotal)
  const [editing, setEditing] = React.useState<CustomerWithCount | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const fetchCustomers = React.useCallback(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("q", debouncedSearch)

    setLoading(true)
    return fetch(`/api/customers?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { customers: CustomerWithCount[]; total: number }) => {
        setCustomers(data.customers)
        setTotal(data.total)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, page])

  const isFirstFetch = React.useRef(true)
  React.useEffect(() => {
    if (isFirstFetch.current) {
      isFirstFetch.current = false
      return
    }
    fetchCustomers()
  }, [fetchCustomers])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleDelete = async (customer: CustomerWithCount) => {
    if (!confirm(`Delete customer "${customer.name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/customers/${customer.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete customer."))
      return
    }

    toast.success("Customer deleted.")
    fetchCustomers()
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
            onSaved={() => fetchCustomers()}
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No customers found.
                </TableCell>
              </TableRow>
            ) : (
              customers.map((customer) => (
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

        {totalPages > 1 ? (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page > 1) setPage(page - 1)
                  }}
                  className={page <= 1 ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="px-2 text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    if (page < totalPages) setPage(page + 1)
                  }}
                  className={page >= totalPages ? "pointer-events-none opacity-50" : undefined}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        ) : null}
      </CardContent>

      {editing ? (
        <CustomerFormDialog
          customer={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={() => {
            setEditing(null)
            fetchCustomers()
          }}
        />
      ) : null}
    </Card>
  )
}
