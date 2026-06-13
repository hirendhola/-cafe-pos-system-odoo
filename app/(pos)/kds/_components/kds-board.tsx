"use client"

import * as React from "react"

import { Search } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type KdsStatus = "TO_COOK" | "PREPARING" | "COMPLETED"

type KdsItem = {
  id: string
  qty: number
  kdsStatus: KdsStatus
  product: { id: string; name: string; category: { id: string; name: string; color: string } }
}

type KdsOrder = {
  id: string
  number: string
  createdAt: string
  table: { number: number; floor: { name: string } } | null
  items: KdsItem[]
}

const STAGE_ORDER: KdsStatus[] = ["TO_COOK", "PREPARING", "COMPLETED"]

const STAGE_LABELS: Record<KdsStatus, string> = {
  TO_COOK: "To cook",
  PREPARING: "Preparing",
  COMPLETED: "Completed",
}

const POLL_INTERVAL_MS = 40000

export function KdsBoard({ categories }: { categories: { id: string; name: string }[] }) {
  const [orders, setOrders] = React.useState<KdsOrder[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState("all")

  const fetchTickets = React.useCallback(async () => {
    try {
      const res = await fetch("/api/kds")
      if (!res.ok) return
      const data = await res.json()
      setOrders(data)
    } catch {
      // ignore transient network errors, next poll retries
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchTickets()
    const interval = setInterval(fetchTickets, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [fetchTickets])

  const advanceItem = async (item: KdsItem) => {
    const next = STAGE_ORDER[STAGE_ORDER.indexOf(item.kdsStatus) + 1]
    if (!next) return

    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        items: order.items.map((i) => (i.id === item.id ? { ...i, kdsStatus: next } : i)),
      })),
    )

    const res = await fetch(`/api/order-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kdsStatus: next }),
    })

    if (!res.ok) {
      toast.error("Failed to update item status.")
      fetchTickets()
    }
  }

  const matchesFilters = (item: KdsItem) => {
    if (categoryFilter !== "all" && item.product.category.id !== categoryFilter) return false
    if (search && !item.product.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }

  const visibleOrders = orders
    .map((order) => ({ ...order, items: order.items.filter(matchesFilters) }))
    .filter((order) => order.items.length > 0)

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={categoryFilter === "all" ? "default" : "outline"}
            onClick={() => setCategoryFilter("all")}
          >
            All
          </Button>
          {categories.map((category) => (
            <Button
              key={category.id}
              size="sm"
              variant={categoryFilter === category.id ? "default" : "outline"}
              onClick={() => setCategoryFilter(category.id)}
            >
              {category.name}
            </Button>
          ))}
        </div>
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="pl-8"
          />
        </div>
      </div>

      {loading ? (
        <p className="py-12 text-center text-sm text-muted-foreground">Loading tickets...</p>
      ) : visibleOrders.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No active tickets.</p>
      ) : (
        <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto pb-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleOrders.map((order) => (
            <div key={order.id} className="flex flex-col gap-3 rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{order.number}</div>
                  <div className="text-xs text-muted-foreground">
                    {order.table ? `Table ${order.table.number} · ${order.table.floor.name}` : "Takeaway"}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <ul className="flex flex-col gap-2">
                {order.items.map((item) => {
                  const next = STAGE_ORDER[STAGE_ORDER.indexOf(item.kdsStatus) + 1]

                  return (
                    <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border p-2">
                      <div
                        className={cn(
                          "text-sm",
                          item.kdsStatus === "COMPLETED" && "text-muted-foreground line-through",
                        )}
                      >
                        <span className="font-medium">{item.qty}x</span> {item.product.name}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={item.kdsStatus === "COMPLETED" ? "secondary" : "outline"}>
                          {STAGE_LABELS[item.kdsStatus]}
                        </Badge>
                        {next ? (
                          <Button size="sm" variant="outline" onClick={() => advanceItem(item)}>
                            Mark {STAGE_LABELS[next]}
                          </Button>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
