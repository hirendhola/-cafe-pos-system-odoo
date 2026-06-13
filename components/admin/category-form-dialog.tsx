"use client"

import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

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
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { extractErrorMessage } from "@/lib/form-error"

const categorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a hex color like #6366f1"),
})

export type CategoryFormValues = z.infer<typeof categorySchema>
export type CategoryRecord = CategoryFormValues & { id: string }

export function CategoryFormDialog({
  category,
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  category?: CategoryRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (category: CategoryRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: category?.name ?? "", color: category?.color ?? "#6366f1" },
  })

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset({ name: category?.name ?? "", color: category?.color ?? "#6366f1" })
    }
  }, [dialogOpen, category, form])

  const onSubmit = async (values: CategoryFormValues) => {
    const url = category ? `/api/categories/${category.id}` : "/api/categories"
    const method = category ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save category."))
      return
    }

    const saved = (await res.json()) as CategoryRecord
    toast.success(category ? "Category updated." : "Category created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit category" : "New category"}</DialogTitle>
          <DialogDescription>Categories group products and color-code them across the POS.</DialogDescription>
        </DialogHeader>
        <form id="category-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-name">Name</FieldLabel>
                  <Input id="category-name" placeholder="Beverages" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="color"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="category-color">Color</FieldLabel>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-1"
                      value={field.value}
                      onChange={field.onChange}
                      aria-label="Category color"
                    />
                    <Input id="category-color" {...field} aria-invalid={fieldState.invalid} className="font-mono" />
                  </div>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={form.formState.isSubmitting}>
            {category ? "Save changes" : "Create category"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
