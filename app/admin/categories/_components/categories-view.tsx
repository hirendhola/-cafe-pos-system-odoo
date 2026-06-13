"use client"

import * as React from "react"

import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { CategoryFormDialog, type CategoryRecord } from "@/components/admin/category-form-dialog"
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

type CategoryWithCount = CategoryRecord & { _count: { products: number } }

export function CategoriesView({ initialCategories }: { initialCategories: CategoryWithCount[] }) {
  const [categories, setCategories] = React.useState(initialCategories)
  const [editing, setEditing] = React.useState<CategoryWithCount | null>(null)

  const handleDelete = async (category: CategoryWithCount) => {
    if (!confirm(`Delete category "${category.name}"?`)) return

    const res = await fetch(`/api/categories/${category.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete category."))
      return
    }

    setCategories((prev) => prev.filter((c) => c.id !== category.id))
    toast.success("Category deleted.")
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Categories</CardTitle>
        <CardDescription>Group products and color-code them across the POS and KDS.</CardDescription>
        <CardAction>
          <CategoryFormDialog
            trigger={
              <Button size="sm">
                <Plus /> Add category
              </Button>
            }
            onSaved={(saved) =>
              setCategories((prev) =>
                [...prev, { ...saved, _count: { products: 0 } }].sort((a, b) => a.name.localeCompare(b.name)),
              )
            }
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Products</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                  No categories yet.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <span
                      className="inline-block size-5 rounded-full border"
                      style={{ backgroundColor: category.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{category._count.products}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${category.name}`}>
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setEditing(category)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" onSelect={() => handleDelete(category)}>
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
        <CategoryFormDialog
          category={editing}
          open={!!editing}
          onOpenChange={(open) => !open && setEditing(null)}
          onSaved={(saved) => {
            setCategories((prev) => prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)))
            setEditing(null)
          }}
        />
      ) : null}
    </Card>
  )
}
