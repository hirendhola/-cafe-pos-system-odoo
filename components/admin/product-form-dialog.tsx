"use client"

import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Plus } from "lucide-react"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { CategoryFormDialog, type CategoryRecord } from "@/components/admin/category-form-dialog"
import { ImageUpload } from "@/components/admin/image-upload"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { extractErrorMessage } from "@/lib/form-error"

function numericString(message: string, opts?: { max?: number }) {
  return z
    .string()
    .min(1, message)
    .refine((value) => {
      const n = Number(value)
      if (Number.isNaN(n) || n < 0) return false
      if (opts?.max !== undefined && n > opts.max) return false
      return true
    }, message)
}

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  categoryId: z.string().min(1, "Pick a category"),
  price: numericString("Price must be a number ≥ 0"),
  unit: z.string().min(1, "Unit is required"),
  tax: numericString("Tax must be between 0 and 100", { max: 100 }),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  showOnKds: z.boolean(),
  active: z.boolean(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

export type ProductRecord = {
  id: string
  name: string
  price: number
  unit: string
  tax: number
  description: string | null
  imageUrl: string | null
  showOnKds: boolean
  active: boolean
  categoryId: string
  category: CategoryRecord
}

export function ProductFormDialog({
  product,
  categories,
  open,
  onOpenChange,
  trigger,
  onSaved,
  onCategoryCreated,
}: {
  product?: ProductRecord
  categories: CategoryRecord[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (product: ProductRecord) => void
  onCategoryCreated?: (category: CategoryRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const [categoryDialogOpen, setCategoryDialogOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const defaultValues = React.useMemo<ProductFormValues>(
    () => ({
      name: product?.name ?? "",
      categoryId: product?.categoryId ?? categories[0]?.id ?? "",
      price: product ? String(product.price) : "0",
      unit: product?.unit ?? "pcs",
      tax: product ? String(product.tax) : "0",
      description: product?.description ?? "",
      imageUrl: product?.imageUrl ?? "",
      showOnKds: product?.showOnKds ?? true,
      active: product?.active ?? true,
    }),
    [product, categories],
  )

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(defaultValues)
    }
  }, [dialogOpen, defaultValues, form])

  const onSubmit = async (values: ProductFormValues) => {
    const url = product ? `/api/products/${product.id}` : "/api/products"
    const method = product ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save product."))
      return
    }

    const saved = (await res.json()) as ProductRecord
    toast.success(product ? "Product updated." : "Product created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{product ? "Edit product" : "New product"}</DialogTitle>
            <DialogDescription>Products appear on the POS order screen, grouped by category.</DialogDescription>
          </DialogHeader>
          <form
            id="product-form"
            noValidate
            onSubmit={form.handleSubmit(onSubmit)}
            className="max-h-[65vh] pr-1 overflow-auto"
          >
            <FieldGroup className="gap-4 ">
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-name">Name</FieldLabel>
                    <Input id="product-name" placeholder="Cappuccino" {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="categoryId"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-category">Category</FieldLabel>
                    <div className="flex items-center gap-2">
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger id="product-category" className="w-full" aria-invalid={fieldState.invalid}>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              <span className="inline-flex items-center gap-2">
                                <span
                                  className="inline-block size-2.5 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.name}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => setCategoryDialogOpen(true)}
                        aria-label="New category"
                      >
                        <Plus />
                      </Button>
                    </div>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <Controller
                  control={form.control}
                  name="price"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="product-price">Price</FieldLabel>
                      <Input
                        id="product-price"
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="unit"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="product-unit">Unit</FieldLabel>
                      <Input id="product-unit" placeholder="pcs" {...field} aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="tax"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="product-tax">Tax %</FieldLabel>
                      <Input
                        id="product-tax"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        inputMode="decimal"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>

              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-image">Image</FieldLabel>
                    <ImageUpload
                      id="product-image"
                      value={field.value}
                      onChange={field.onChange}
                      disabled={form.formState.isSubmitting}
                    />
                    <FieldDescription>Optional. Shown on the POS product grid and KDS tickets.</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <Controller
                control={form.control}
                name="description"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="product-description">Description</FieldLabel>
                    <Textarea id="product-description" rows={2} {...field} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="showOnKds"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="product-show-kds" className="flex-1">
                        Show on KDS
                      </FieldLabel>
                      <Switch id="product-show-kds" checked={field.value} onCheckedChange={field.onChange} />
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="active"
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <FieldLabel htmlFor="product-active" className="flex-1">
                        Active
                      </FieldLabel>
                      <Switch id="product-active" checked={field.value} onCheckedChange={field.onChange} />
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>
          </form>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" form="product-form" disabled={form.formState.isSubmitting}>
              {product ? "Save changes" : "Create product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CategoryFormDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        onSaved={(saved) => {
          onCategoryCreated?.(saved)
          form.setValue("categoryId", saved.id, { shouldValidate: true })
        }}
      />
    </>
  )
}
