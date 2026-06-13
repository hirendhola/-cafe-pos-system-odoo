"use client"

import * as React from "react"

import { useRouter } from "next/navigation"

import { Minus, Plus, Search, Send, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

type CategoryRecord = { id: string; name: string; color: string }

type ProductRecord = {
  id: string
  name: string
  price: number
  tax: number
  imageUrl: string | null
  categoryId: string
  category: CategoryRecord
}

type KdsStatus = "TO_COOK" | "PREPARING" | "COMPLETED"

const KDS_LABELS: Record<KdsStatus, string> = {
  TO_COOK: "To cook",
  PREPARING: "Preparing",
  COMPLETED: "Completed",
}

type ExistingOrder = {
  id: string
  number: string
  total: number
  items: {
    id: string
    qty: number
    kdsStatus: KdsStatus
    product: { id: string; name: string }
  }[]
}

type SelectedTable = {
  id: string
  number: number
  floor: { id: string; name: string }
  orders: ExistingOrder[]
} | null

export function OrderView({
  categories,
  products,
  table,
}: {
  categories: CategoryRecord[]
  products: ProductRecord[]
  table: SelectedTable
}) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [cart, setCart] = React.useState<{ product: ProductRecord; qty: number }[]>([])
  const [sending, setSending] = React.useState(false)

  const filteredProducts = React.useMemo(() => {
    return products.filter((product) => {
      if (activeCategory !== "all" && product.categoryId !== activeCategory) return false
      if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, activeCategory, search])

  const addToCart = (product: ProductRecord) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id)
      if (existing) {
        return prev.map((item) => (item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item))
      }
      return [...prev, { product, qty: 1 }]
    })
  }

  const updateQty = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.product.id === productId ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0),
    )
  }

  const removeItem = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId))
  }

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const tax = cart.reduce((sum, item) => sum + item.product.price * item.qty * (item.product.tax / 100), 0)
  const total = subtotal + tax

  const handleSendToKitchen = async () => {
    if (!table || cart.length === 0) return

    setSending(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          items: cart.map((item) => ({ productId: item.product.id, qty: item.qty })),
        }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to send order to kitchen."))
        return
      }

      toast.success(`Sent to kitchen — Order ${data.number}`)
      setCart([])
      router.refresh()
    } finally {
      setSending(false)
    }
  }

  const existingOrder = table?.orders[0]

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col gap-4 overflow-hidden p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                size="sm"
                variant={activeCategory === category.id ? "default" : "outline"}
                onClick={() => setActiveCategory(category.id)}
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

        <ScrollArea className="flex-1">
          {filteredProducts.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 pb-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => addToCart(product)}
                  className="flex flex-col items-stretch overflow-hidden rounded-xl border text-left transition-colors hover:border-primary"
                >
                  <div
                    className="flex h-20 items-center justify-center overflow-hidden text-2xl font-semibold text-white"
                    style={{ backgroundColor: product.category.color }}
                  >
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      product.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 p-2">
                    <span className="line-clamp-1 text-sm font-medium">{product.name}</span>
                    <span className="text-xs text-muted-foreground">{currency.format(product.price)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      <div className="flex w-96 flex-col border-l">
        <div className="border-b p-4">
          {table ? (
            <div>
              <div className="text-sm text-muted-foreground">Floor {table.floor.name}</div>
              <div className="text-lg font-semibold">Table {table.number}</div>
              {existingOrder ? (
                <Badge variant="secondary" className="mt-1">
                  Order {existingOrder.number} in progress
                </Badge>
              ) : null}
            </div>
          ) : (
            <div>
              <div className="text-lg font-semibold">No table selected</div>
              <p className="text-sm text-muted-foreground">Pick a table from the top bar to start an order.</p>
            </div>
          )}
        </div>

        {existingOrder ? (
          <div className="border-b p-4">
            <div className="mb-2 text-sm font-medium">Already sent to kitchen</div>
            <ul className="flex flex-col gap-1 text-sm">
              {existingOrder.items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-2">
                  <span className={item.kdsStatus === "COMPLETED" ? "text-muted-foreground line-through" : ""}>
                    {item.qty} x {item.product.name}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    {KDS_LABELS[item.kdsStatus]}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <ScrollArea className="flex-1 p-4">
          {cart.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Tap a product to add it to the order.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {cart.map((item) => (
                <li key={item.product.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 text-sm font-medium">{item.product.name}</div>
                    <div className="text-xs text-muted-foreground">{currency.format(item.product.price)} each</div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="icon-sm" variant="outline" onClick={() => updateQty(item.product.id, -1)}>
                      <Minus />
                    </Button>
                    <span className="w-6 text-center text-sm">{item.qty}</span>
                    <Button size="icon-sm" variant="outline" onClick={() => updateQty(item.product.id, 1)}>
                      <Plus />
                    </Button>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">
                    {currency.format(item.product.price * item.qty)}
                  </div>
                  <Button size="icon-sm" variant="ghost" onClick={() => removeItem(item.product.id)}>
                    <Trash2 />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="flex flex-col gap-2 border-t p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{currency.format(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>{currency.format(tax)}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-base font-semibold">
            <span>Total</span>
            <span>{currency.format(total)}</span>
          </div>
          <Button className="mt-2" disabled={!table || cart.length === 0 || sending} onClick={handleSendToKitchen}>
            <Send /> {sending ? "Sending..." : "Send to Kitchen"}
          </Button>
        </div>
      </div>
    </div>
  )
}
