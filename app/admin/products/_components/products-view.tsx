"use client"

import * as React from "react"

import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { type CategoryRecord } from "@/components/admin/category-form-dialog"
import { ProductFormDialog, type ProductRecord } from "@/components/admin/product-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

function ProductThumbnail({ product }: { product: ProductRecord }) {
  if (product.imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={product.imageUrl} alt={product.name} className="size-9 rounded-md object-cover" />
  }

  return (
    <div
      className="flex size-9 items-center justify-center rounded-md text-sm font-semibold text-white"
      style={{ backgroundColor: product.category.color }}
    >
      {product.name.charAt(0).toUpperCase()}
    </div>
  )
}

export function ProductsView({
  initialProducts,
  initialCategories,
}: {
  initialProducts: ProductRecord[]
  initialCategories: CategoryRecord[]
}) {
  const [products, setProducts] = React.useState(initialProducts)
  const [categories, setCategories] = React.useState(initialCategories)
  const [editing, setEditing] = React.useState<ProductRecord | null>(null)

  const handleCategoryCreated = (category: CategoryRecord) => {
    setCategories((prev) => [...prev, category].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleDelete = async (product: ProductRecord) => {
    if (!confirm(`Delete product "${product.name}"?`)) return

    const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete product."))
      return
    }

    setProducts((prev) => prev.filter((p) => p.id !== product.id))
    toast.success("Product deleted.")
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Products</CardTitle>
        <CardDescription>Manage the menu shown on the POS order screen.</CardDescription>
        <CardAction>
          <ProductFormDialog
            categories={categories}
            trigger={
              <Button size="sm">
                <Plus /> Add product
              </Button>
            }
            onCategoryCreated={handleCategoryCreated}
            onSaved={(saved) =>
              setProducts((prev) => [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)))
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Tax</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products yet.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductThumbnail product={product} />
                      <div className="min-w-0">
                        <div className="truncate font-medium">{product.name}</div>
                        {product.description ? (
                          <div className="truncate text-xs text-muted-foreground">{product.description}</div>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span
                        className="inline-block size-2.5 rounded-full"
                        style={{ backgroundColor: product.category.color }}
                      />
                      {product.category.name}
                    </span>
                  </TableCell>
                  <TableCell>{currency.format(product.price)}</TableCell>
                  <TableCell>{product.unit}</TableCell>
                  <TableCell>{product.tax}%</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={product.active ? "default" : "outline"}>
                        {product.active ? "Active" : "Inactive"}
                      </Badge>
                      {product.showOnKds ? <Badge variant="secondary">KDS</Badge> : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${product.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(product)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(product)}>
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
        <ProductFormDialog
          product={editing}
          categories={categories}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onCategoryCreated={handleCategoryCreated}
          onSaved={(saved) => {
            setProducts((prev) => prev.map((p) => (p.id === saved.id ? saved : p)))
            setEditing(null)
          }}
        />
      ) : null}
    </Card>
  )
}
