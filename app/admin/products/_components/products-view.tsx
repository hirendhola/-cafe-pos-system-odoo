"use client"

import * as React from "react"

import { MoreHorizontal, Plus, Search } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { extractErrorMessage } from "@/lib/form-error"

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })

const PAGE_SIZE = 20
const ALL = "all"

const SORT_OPTIONS = [
  { value: "name_asc", label: "Name (A-Z)" },
  { value: "name_desc", label: "Name (Z-A)" },
  { value: "price_asc", label: "Price (low to high)" },
  { value: "price_desc", label: "Price (high to low)" },
] as const

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
  initialProductsTotal,
  initialCategories,
}: {
  initialProducts: ProductRecord[]
  initialProductsTotal: number
  initialCategories: CategoryRecord[]
}) {
  const [products, setProducts] = React.useState(initialProducts)
  const [total, setTotal] = React.useState(initialProductsTotal)
  const [categories, setCategories] = React.useState(initialCategories)
  const [editing, setEditing] = React.useState<ProductRecord | null>(null)
  const [loading, setLoading] = React.useState(false)

  const [search, setSearch] = React.useState("")
  const [debouncedSearch, setDebouncedSearch] = React.useState("")
  const [categoryFilter, setCategoryFilter] = React.useState(ALL)
  const [statusFilter, setStatusFilter] = React.useState(ALL)
  const [sort, setSort] = React.useState<string>("name_asc")
  const [page, setPage] = React.useState(1)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPage(1)
    }, 300)
    return () => clearTimeout(timeout)
  }, [search])

  const fetchProducts = React.useCallback(() => {
    const params = new URLSearchParams({ sort, page: String(page), pageSize: String(PAGE_SIZE) })
    if (debouncedSearch) params.set("q", debouncedSearch)
    if (categoryFilter !== ALL) params.set("categoryId", categoryFilter)
    if (statusFilter !== ALL) params.set("active", statusFilter)

    setLoading(true)
    return fetch(`/api/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data: { products: ProductRecord[]; total: number }) => {
        setProducts(data.products)
        setTotal(data.total)
      })
      .finally(() => setLoading(false))
  }, [debouncedSearch, categoryFilter, statusFilter, sort, page])

  const isFirstFetch = React.useRef(true)
  React.useEffect(() => {
    if (isFirstFetch.current) {
      isFirstFetch.current = false
      return
    }
    fetchProducts()
  }, [fetchProducts])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleCategoryFilterChange = (value: string) => {
    setPage(1)
    setCategoryFilter(value)
  }

  const handleStatusFilterChange = (value: string) => {
    setPage(1)
    setStatusFilter(value)
  }

  const handleSortChange = (value: string) => {
    setPage(1)
    setSort(value)
  }

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

    toast.success("Product deleted.")
    fetchProducts()
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
            onSaved={() => fetchProducts()}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative max-w-xs flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="true">Active</SelectItem>
              <SelectItem value="false">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  No products found.
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
        <ProductFormDialog
          product={editing}
          categories={categories}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onCategoryCreated={handleCategoryCreated}
          onSaved={() => {
            setEditing(null)
            fetchProducts()
          }}
        />
      ) : null}
    </Card>
  )
}
