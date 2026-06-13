"use client"

import * as React from "react"

import { Plus, Search, X } from "lucide-react"
import { toast } from "sonner"

import type { CustomerRecord } from "@/components/admin/customer-form-dialog"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { extractErrorMessage } from "@/lib/form-error"

export function CustomerPickerDialog({
  open,
  onOpenChange,
  value,
  onSelect,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  value: CustomerRecord | null
  onSelect: (customer: CustomerRecord | null) => void
}) {
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<CustomerRecord[]>([])
  const [loading, setLoading] = React.useState(false)
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [newCustomer, setNewCustomer] = React.useState({ name: "", email: "", phone: "" })
  const [creating, setCreating] = React.useState(false)

  React.useEffect(() => {
    if (!open) return

    setQuery("")
    setResults([])
    setShowAddForm(false)
    setNewCustomer({ name: "", email: "", phone: "" })
  }, [open])

  React.useEffect(() => {
    if (!open) return

    const term = query.trim()
    if (!term) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?q=${encodeURIComponent(term)}`)
        if (res.ok) {
          setResults(await res.json())
        }
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timeout)
  }, [query, open])

  const handleSelect = (customer: CustomerRecord) => {
    onSelect(customer)
    onOpenChange(false)
  }

  const handleClear = () => {
    onSelect(null)
    onOpenChange(false)
  }

  const handleCreate = async () => {
    if (!newCustomer.name.trim()) {
      toast.error("Name is required.")
      return
    }

    setCreating(true)
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCustomer),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        toast.error(extractErrorMessage(data, "Failed to create customer."))
        return
      }

      const created = (await res.json()) as CustomerRecord
      toast.success("Customer created.")
      handleSelect(created)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign customer</DialogTitle>
          <DialogDescription>Search for an existing customer or add a new one.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              autoFocus
              placeholder="Search by name, email or phone..."
              className="pl-8"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {value ? (
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2 text-sm">
              <div>
                <div className="font-medium">{value.name}</div>
                <div className="text-xs text-muted-foreground">{value.email ?? value.phone ?? "No contact info"}</div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
                <X /> Remove
              </Button>
            </div>
          ) : null}

          <ScrollArea className="h-60 rounded-md border">
            <div className="flex flex-col gap-0.5 p-1">
              {loading ? (
                <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
              ) : results.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  {query.trim() ? "No customers found." : "Start typing to search customers."}
                </div>
              ) : (
                results.map((customer) => (
                  <button
                    key={customer.id}
                    type="button"
                    onClick={() => handleSelect(customer)}
                    className="flex flex-col items-start rounded-md px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
                  >
                    <span className="font-medium">{customer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {[customer.email, customer.phone].filter(Boolean).join(" · ") || "No contact info"}
                    </span>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          <Separator />

          {showAddForm ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="new-customer-name">Name</Label>
                <Input
                  id="new-customer-name"
                  placeholder="Customer name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-customer-email">Email</Label>
                  <Input
                    id="new-customer-email"
                    type="email"
                    placeholder="Optional"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="new-customer-phone">Phone</Label>
                  <Input
                    id="new-customer-phone"
                    placeholder="Optional"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer((prev) => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
                <Button type="button" size="sm" onClick={handleCreate} disabled={creating}>
                  Create & assign
                </Button>
              </div>
            </div>
          ) : (
            <Button type="button" variant="outline" onClick={() => setShowAddForm(true)}>
              <Plus /> Add new customer
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
