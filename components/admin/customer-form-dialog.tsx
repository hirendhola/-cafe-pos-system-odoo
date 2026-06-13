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

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.union([z.string().trim().email("Enter a valid email"), z.literal("")]),
  phone: z.string().trim(),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>

export type CustomerRecord = {
  id: string
  name: string
  email: string | null
  phone: string | null
}

export function CustomerFormDialog({
  customer,
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  customer?: CustomerRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (customer: CustomerRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const defaultValues = React.useMemo<CustomerFormValues>(
    () => ({
      name: customer?.name ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
    }),
    [customer],
  )

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(defaultValues)
    }
  }, [dialogOpen, defaultValues, form])

  const onSubmit = async (values: CustomerFormValues) => {
    const url = customer ? `/api/customers/${customer.id}` : "/api/customers"
    const method = customer ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save customer."))
      return
    }

    const saved = (await res.json()) as CustomerRecord
    toast.success(customer ? "Customer updated." : "Customer created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{customer ? "Edit customer" : "New customer"}</DialogTitle>
          <DialogDescription>Customers can be linked to orders for receipts and history.</DialogDescription>
        </DialogHeader>
        <form id="customer-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="customer-name">Name</FieldLabel>
                  <Input id="customer-name" placeholder="Walk-in customer" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="customer-email">Email</FieldLabel>
                  <Input
                    id="customer-email"
                    type="email"
                    placeholder="customer@example.com"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="phone"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="customer-phone">Phone</FieldLabel>
                  <Input id="customer-phone" placeholder="+91 98765 43210" {...field} aria-invalid={fieldState.invalid} />
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
          <Button type="submit" form="customer-form" disabled={form.formState.isSubmitting}>
            {customer ? "Save changes" : "Create customer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
