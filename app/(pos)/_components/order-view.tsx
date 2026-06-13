"use client"

import * as React from "react"

import { useRouter } from "next/navigation"

import { CreditCard, Minus, Plus, Search, Send, Trash2, UserRound } from "lucide-react"
import { toast } from "sonner"

import type { CustomerRecord } from "@/components/admin/customer-form-dialog"
import { CustomerPickerDialog } from "@/components/pos/customer-picker-dialog"
import { PaymentDialog } from "@/components/pos/payment-dialog"
import { ReceiptView, type ReceiptOrder } from "@/components/pos/receipt-view"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
  subtotal: number
  tax: number
  discount: number
  total: number
  customer: CustomerRecord | null
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
  hasOpenSession,
}: {
  categories: CategoryRecord[]
  products: ProductRecord[]
  table: SelectedTable
  hasOpenSession: boolean
}) {
  const router = useRouter()
  const [activeCategory, setActiveCategory] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [cart, setCart] = React.useState<{ product: ProductRecord; qty: number }[]>([])
  const [sending, setSending] = React.useState(false)
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [updatingCustomer, setUpdatingCustomer] = React.useState(false)
  const [paymentOpen, setPaymentOpen] = React.useState(false)
  const [receiptOrder, setReceiptOrder] = React.useState<ReceiptOrder | null>(null)
  const existingOrder = table?.orders[0]
  const [selectedCustomer, setSelectedCustomer] = React.useState<CustomerRecord | null>(existingOrder?.customer ?? null)

  React.useEffect(() => {
    setSelectedCustomer(existingOrder?.customer ?? null)
  }, [table?.id, existingOrder?.id, existingOrder?.customer?.id])

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

  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.price * item.qty, 0)
  const cartTax = cart.reduce((sum, item) => sum + item.product.price * item.qty * (item.product.tax / 100), 0)
  const cartTotal = cartSubtotal + cartTax

  const showOrderTotals = cart.length === 0 && !!existingOrder
  const subtotal = showOrderTotals ? existingOrder!.subtotal : cartSubtotal
  const tax = showOrderTotals ? existingOrder!.tax : cartTax
  const discount = showOrderTotals ? existingOrder!.discount : 0
  const total = showOrderTotals ? existingOrder!.total : cartTotal

  const handlePaid = (order: ReceiptOrder) => {
    setReceiptOrder(order)
    router.refresh()
  }

  const handleSendToKitchen = async () => {
    if (!table || cart.length === 0) return

    setSending(true)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tableId: table.id,
          customerId: selectedCustomer?.id ?? undefined,
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

  const handleCustomerSelect = async (customer: CustomerRecord | null) => {
    if (!existingOrder) {
      setSelectedCustomer(customer)
      return
    }

    setUpdatingCustomer(true)
    try {
      const res = await fetch(`/api/orders/${existingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer?.id ?? null }),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        toast.error(extractErrorMessage(data, "Failed to update customer."))
        return
      }

      setSelectedCustomer(customer)
      toast.success(customer ? `Customer set to ${customer.name}.` : "Customer removed.")
      router.refresh()
    } finally {
      setUpdatingCustomer(false)
    }
  }

  return (
    <div className="flex h-full overflow-hidden">
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

      <div className="flex w-96 flex-col overflow-hidden border-l">
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

        {table ? (
          <div className="border-b p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Customer</span>
              <Button size="sm" variant="outline" disabled={updatingCustomer} onClick={() => setPickerOpen(true)}>
                <UserRound /> {selectedCustomer ? "Change" : "Add customer"}
              </Button>
            </div>
            {selectedCustomer ? (
              <div className="text-sm">
                <div className="font-medium">{selectedCustomer.name}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedCustomer.email ?? selectedCustomer.phone ?? "No contact info"}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No customer assigned.</p>
            )}
          </div>
        ) : null}

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
          {discount > 0 ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Discount</span>
              <span>-{currency.format(discount)}</span>
            </div>
          ) : null}
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
          {existingOrder ? (
            cart.length > 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Send pending items to kitchen before checkout.
              </p>
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={existingOrder.total <= 0 || !hasOpenSession}
                  onClick={() => setPaymentOpen(true)}
                >
                  <CreditCard /> Payment
                </Button>
                {!hasOpenSession ? (
                  <p className="text-center text-xs text-muted-foreground">Open a session to take payments.</p>
                ) : null}
              </>
            )
          ) : null}
        </div>
      </div>

      <CustomerPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={selectedCustomer}
        onSelect={handleCustomerSelect}
      />

      {existingOrder ? (
        <PaymentDialog
          open={paymentOpen}
          onOpenChange={setPaymentOpen}
          order={{ id: existingOrder.id, number: existingOrder.number, total: existingOrder.total }}
          onPaid={handlePaid}
        />
      ) : null}

      <Dialog open={!!receiptOrder} onOpenChange={(open) => !open && setReceiptOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment received</DialogTitle>
          </DialogHeader>
          {receiptOrder ? <ReceiptView order={receiptOrder} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
