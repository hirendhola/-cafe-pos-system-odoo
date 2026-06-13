"use client"

import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { extractErrorMessage } from "@/lib/form-error"
import { cn } from "@/lib/utils"

function positiveNumberString(message: string) {
  return z.string().min(1, message).refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, message)
}

const promotionFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    target: z.enum(["PRODUCT", "ORDER"]),
    productId: z.string().optional(),
    minQty: z.string().optional(),
    minOrderAmount: z.string().optional(),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: positiveNumberString("Value must be greater than 0"),
    active: z.boolean(),
  })
  .refine((data) => data.target !== "PRODUCT" || !!data.productId, {
    message: "Pick a product",
    path: ["productId"],
  })
  .refine((data) => data.target !== "ORDER" || (!!data.minOrderAmount && Number(data.minOrderAmount) > 0), {
    message: "Minimum order amount is required",
    path: ["minOrderAmount"],
  })
  .refine((data) => data.discountType !== "PERCENT" || Number(data.value) <= 100, {
    message: "Percent value cannot exceed 100",
    path: ["value"],
  })

export type PromotionFormValues = z.infer<typeof promotionFormSchema>
export type PromotionRecord = {
  id: string
  name: string
  target: "PRODUCT" | "ORDER"
  productId: string | null
  product: { id: string; name: string } | null
  minQty: number | null
  minOrderAmount: number | null
  discountType: "PERCENT" | "FIXED"
  value: number
  active: boolean
}

export function PromotionFormDialog({
  promotion,
  products,
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  promotion?: PromotionRecord
  products: { id: string; name: string }[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (promotion: PromotionRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const defaultValues = React.useMemo<PromotionFormValues>(
    () => ({
      name: promotion?.name ?? "",
      target: promotion?.target ?? "PRODUCT",
      productId: promotion?.productId ?? products[0]?.id ?? "",
      minQty: promotion?.minQty != null ? String(promotion.minQty) : "1",
      minOrderAmount: promotion?.minOrderAmount != null ? String(promotion.minOrderAmount) : "",
      discountType: promotion?.discountType ?? "PERCENT",
      value: promotion ? String(promotion.value) : "",
      active: promotion?.active ?? true,
    }),
    [promotion, products],
  )

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (dialogOpen) form.reset(defaultValues)
  }, [dialogOpen, defaultValues, form])

  const target = form.watch("target")
  const [productPickerOpen, setProductPickerOpen] = React.useState(false)

  const productNames = React.useMemo(
    () => new Map(products.map((product) => [product.id, product.name])),
    [products],
  )

  const onSubmit = async (values: PromotionFormValues) => {
    const url = promotion ? `/api/promotions/${promotion.id}` : "/api/promotions"
    const method = promotion ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        target: values.target,
        discountType: values.discountType,
        value: Number(values.value),
        active: values.active,
        productId: values.target === "PRODUCT" ? values.productId : undefined,
        minQty: values.target === "PRODUCT" && values.minQty ? Number(values.minQty) : undefined,
        minOrderAmount: values.target === "ORDER" ? Number(values.minOrderAmount) : undefined,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save promotion."))
      return
    }

    const saved = (await res.json()) as PromotionRecord
    toast.success(promotion ? "Promotion updated." : "Promotion created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{promotion ? "Edit promotion" : "New promotion"}</DialogTitle>
          <DialogDescription>
            Active promotions are applied automatically to matching orders.
          </DialogDescription>
        </DialogHeader>
        <form id="promotion-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="promotion-name">Name</FieldLabel>
                  <Input
                    id="promotion-name"
                    placeholder="Buy 2 Get 10% Off"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="target"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="promotion-target">Applies to</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="promotion-target" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRODUCT">Specific product</SelectItem>
                      <SelectItem value="ORDER">Whole order</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            {target === "PRODUCT" ? (
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  control={form.control}
                  name="productId"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="promotion-product">Product</FieldLabel>
                      <Popover open={productPickerOpen} onOpenChange={setProductPickerOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            id="promotion-product"
                            type="button"
                            variant="outline"
                            role="combobox"
                            aria-expanded={productPickerOpen}
                            aria-invalid={fieldState.invalid}
                            className="w-full justify-between font-normal"
                          >
                            <span className="truncate">
                              {field.value ? productNames.get(field.value) ?? "Select product..." : "Select product..."}
                            </span>
                            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search products..." />
                            <CommandList className="max-h-none overflow-visible p-0">
                              <CommandEmpty>No products found.</CommandEmpty>
                              <ScrollArea className="h-60">
                                <CommandGroup>
                                  {products.map((product) => (
                                    <CommandItem
                                      key={product.id}
                                      value={product.name}
                                      onSelect={() => {
                                        field.onChange(product.id)
                                        setProductPickerOpen(false)
                                      }}
                                    >
                                      <CheckIcon
                                        className={cn("size-4", field.value === product.id ? "opacity-100" : "opacity-0")}
                                      />
                                      {product.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </ScrollArea>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="minQty"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="promotion-min-qty">Min. quantity</FieldLabel>
                      <Input
                        id="promotion-min-qty"
                        type="number"
                        step="1"
                        min="1"
                        inputMode="numeric"
                        {...field}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            ) : (
              <Controller
                control={form.control}
                name="minOrderAmount"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="promotion-min-order">Minimum order amount (₹)</FieldLabel>
                    <Input
                      id="promotion-min-order"
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
            )}

            <div className="grid grid-cols-2 gap-4">
              <Controller
                control={form.control}
                name="discountType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="promotion-discount-type">Discount type</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="promotion-discount-type" className="w-full" aria-invalid={fieldState.invalid}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENT">Percent</SelectItem>
                        <SelectItem value="FIXED">Fixed amount</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="value"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="promotion-value">
                      Value {form.watch("discountType") === "PERCENT" ? "(%)" : "(₹)"}
                    </FieldLabel>
                    <Input
                      id="promotion-value"
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
            </div>

            <Controller
              control={form.control}
              name="active"
              render={({ field }) => (
                <Field orientation="horizontal">
                  <FieldLabel htmlFor="promotion-active" className="flex-1">
                    Active
                  </FieldLabel>
                  <Switch id="promotion-active" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="promotion-form" disabled={form.formState.isSubmitting}>
            {promotion ? "Save changes" : "Create promotion"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
