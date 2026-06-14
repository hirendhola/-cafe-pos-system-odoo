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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { extractErrorMessage } from "@/lib/form-error"

const couponFormSchema = z
  .object({
    code: z.string().min(1, "Code is required"),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z
      .string()
      .min(1, "Value is required")
      .refine((value) => Number.isFinite(Number(value)) && Number(value) > 0, "Value must be greater than 0"),
    active: z.boolean(),
  })
  .refine((data) => data.discountType !== "PERCENT" || Number(data.value) <= 100, {
    message: "Percent value cannot exceed 100",
    path: ["value"],
  })

export type CouponFormValues = z.infer<typeof couponFormSchema>
export type CouponRecord = {
  id: string
  code: string
  discountType: "PERCENT" | "FIXED"
  value: number
  active: boolean
}

export function CouponFormDialog({
  coupon,
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  coupon?: CouponRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (coupon: CouponRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const defaultValues = React.useMemo<CouponFormValues>(
    () => ({
      code: coupon?.code ?? "",
      discountType: coupon?.discountType ?? "PERCENT",
      value: coupon ? String(coupon.value) : "",
      active: coupon?.active ?? true,
    }),
    [coupon],
  )

  const form = useForm<CouponFormValues>({
    resolver: zodResolver(couponFormSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (dialogOpen) form.reset(defaultValues)
  }, [dialogOpen, defaultValues, form])

  const onSubmit = async (values: CouponFormValues) => {
    const url = coupon ? `/api/coupons/${coupon.id}` : "/api/coupons"
    const method = coupon ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: values.code,
        discountType: values.discountType,
        value: Number(values.value),
        active: values.active,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save coupon."))
      return
    }

    const saved = (await res.json()) as CouponRecord
    toast.success(coupon ? "Coupon updated." : "Coupon created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{coupon ? "Edit coupon" : "New coupon"}</DialogTitle>
          <DialogDescription>Coupons can be applied to a draft order from the POS Discount dialog.</DialogDescription>
        </DialogHeader>
        <form id="coupon-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="code"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="coupon-code">Code</FieldLabel>
                  <Input
                    id="coupon-code"
                    placeholder="WELCOME10"
                    className="font-mono uppercase"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="discountType"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="coupon-discount-type">Discount type</FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="coupon-discount-type" className="w-full" aria-invalid={fieldState.invalid}>
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
                    <FieldLabel htmlFor="coupon-value">
                      Value {form.watch("discountType") === "PERCENT" ? "(%)" : "(₹)"}
                    </FieldLabel>
                    <Input
                      id="coupon-value"
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
                  <FieldLabel htmlFor="coupon-active" className="flex-1">
                    Active
                  </FieldLabel>
                  <Switch id="coupon-active" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="coupon-form" disabled={form.formState.isSubmitting}>
            {coupon ? "Save changes" : "Create coupon"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
