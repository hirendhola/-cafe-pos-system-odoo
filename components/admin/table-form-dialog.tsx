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
import { Switch } from "@/components/ui/switch"
import { extractErrorMessage } from "@/lib/form-error"

function positiveIntString(message: string) {
  return z
    .string()
    .min(1, message)
    .refine((value) => Number.isInteger(Number(value)) && Number(value) > 0, message)
}

const tableFormSchema = z.object({
  number: positiveIntString("Table number must be a positive whole number"),
  seats: positiveIntString("Seats must be a positive whole number"),
  active: z.boolean(),
})

export type TableFormValues = z.infer<typeof tableFormSchema>
export type TableRecord = { id: string; number: number; seats: number; active: boolean; floorId: string }

export function TableFormDialog({
  floorId,
  table,
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  floorId: string
  table?: TableRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (table: TableRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const defaultValues = React.useMemo<TableFormValues>(
    () => ({
      number: table ? String(table.number) : "",
      seats: table ? String(table.seats) : "2",
      active: table?.active ?? true,
    }),
    [table],
  )

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(defaultValues)
    }
  }, [dialogOpen, defaultValues, form])

  const onSubmit = async (values: TableFormValues) => {
    const url = table ? `/api/tables/${table.id}` : "/api/tables"
    const method = table ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, floorId }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save table."))
      return
    }

    const saved = (await res.json()) as TableRecord
    toast.success(table ? "Table updated." : "Table created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table ? "Edit table" : "New table"}</DialogTitle>
          <DialogDescription>Tables show up in the POS floor pop-up for this floor.</DialogDescription>
        </DialogHeader>
        <form id="table-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={form.control}
                name="number"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="table-number">Table number</FieldLabel>
                    <Input
                      id="table-number"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                control={form.control}
                name="seats"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="table-seats">Seats</FieldLabel>
                    <Input
                      id="table-seats"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
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
                  <FieldLabel htmlFor="table-active" className="flex-1">
                    Active (available for use)
                  </FieldLabel>
                  <Switch id="table-active" checked={field.value} onCheckedChange={field.onChange} />
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" form="table-form" disabled={form.formState.isSubmitting}>
            {table ? "Save changes" : "Create table"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
