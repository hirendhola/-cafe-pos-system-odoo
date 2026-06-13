"use client"

import * as React from "react"

import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { CouponFormDialog, type CouponRecord } from "@/components/admin/coupon-form-dialog"
import { PromotionFormDialog, type PromotionRecord } from "@/components/admin/promotion-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

function formatDiscount(discountType: "PERCENT" | "FIXED", value: number) {
  return discountType === "PERCENT" ? `${value}%` : currency.format(value)
}

export function DiscountsView({
  initialCoupons,
  initialPromotions,
  products,
}: {
  initialCoupons: CouponRecord[]
  initialPromotions: PromotionRecord[]
  products: { id: string; name: string }[]
}) {
  const [coupons, setCoupons] = React.useState(initialCoupons)
  const [promotions, setPromotions] = React.useState(initialPromotions)
  const [editingCoupon, setEditingCoupon] = React.useState<CouponRecord | null>(null)
  const [editingPromotion, setEditingPromotion] = React.useState<PromotionRecord | null>(null)

  const handleDeleteCoupon = async (coupon: CouponRecord) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return

    const res = await fetch(`/api/coupons/${coupon.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete coupon."))
      return
    }

    setCoupons((prev) => prev.filter((c) => c.id !== coupon.id))
    toast.success("Coupon deleted.")
  }

  const handleDeletePromotion = async (promotion: PromotionRecord) => {
    if (!confirm(`Delete promotion "${promotion.name}"?`)) return

    const res = await fetch(`/api/promotions/${promotion.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete promotion."))
      return
    }

    setPromotions((prev) => prev.filter((p) => p.id !== promotion.id))
    toast.success("Promotion deleted.")
  }

  return (
    <Tabs defaultValue="coupons">
      <TabsList>
        <TabsTrigger value="coupons">Coupons</TabsTrigger>
        <TabsTrigger value="promotions">Promotions</TabsTrigger>
      </TabsList>

      <TabsContent value="coupons">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Coupons</CardTitle>
            <CardDescription>Codes staff can apply to a draft order from the Discount dialog.</CardDescription>
            <CardAction>
              <CouponFormDialog
                trigger={
                  <Button size="sm">
                    <Plus /> Add coupon
                  </Button>
                }
                onSaved={(saved) => setCoupons((prev) => [saved, ...prev])}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                      No coupons yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono font-medium">{coupon.code}</TableCell>
                      <TableCell>{formatDiscount(coupon.discountType, coupon.value)}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.active ? "default" : "secondary"}>
                          {coupon.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${coupon.code}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditingCoupon(coupon)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteCoupon(coupon)}>
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
        </Card>
      </TabsContent>

      <TabsContent value="promotions">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Promotions</CardTitle>
            <CardDescription>Active promotions are applied automatically.</CardDescription>
            <CardAction>
              <PromotionFormDialog
                products={products}
                trigger={
                  <Button size="sm">
                    <Plus /> Add promotion
                  </Button>
                }
                onSaved={(saved) => setPromotions((prev) => [saved, ...prev])}
              />
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      No promotions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  promotions.map((promotion) => (
                    <TableRow key={promotion.id}>
                      <TableCell className="font-medium">{promotion.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {promotion.target === "PRODUCT"
                          ? `${promotion.product?.name ?? "—"} (min qty ${promotion.minQty ?? 1})`
                          : `Order ≥ ${currency.format(promotion.minOrderAmount ?? 0)}`}
                      </TableCell>
                      <TableCell>{formatDiscount(promotion.discountType, promotion.value)}</TableCell>
                      <TableCell>
                        <Badge variant={promotion.active ? "default" : "secondary"}>
                          {promotion.active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${promotion.name}`}>
                              <MoreHorizontal />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => setEditingPromotion(promotion)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem variant="destructive" onSelect={() => handleDeletePromotion(promotion)}>
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
        </Card>
      </TabsContent>

      {editingCoupon ? (
        <CouponFormDialog
          coupon={editingCoupon}
          open={!!editingCoupon}
          onOpenChange={(open) => !open && setEditingCoupon(null)}
          onSaved={(saved) => {
            setCoupons((prev) => prev.map((c) => (c.id === saved.id ? saved : c)))
            setEditingCoupon(null)
          }}
        />
      ) : null}

      {editingPromotion ? (
        <PromotionFormDialog
          promotion={editingPromotion}
          products={products}
          open={!!editingPromotion}
          onOpenChange={(open) => !open && setEditingPromotion(null)}
          onSaved={(saved) => {
            setPromotions((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
            setEditingPromotion(null)
          }}
        />
      ) : null}
    </Tabs>
  )
}
