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

const floorSchema = z.object({
  name: z.string().min(1, "Name is required"),
})

export type FloorFormValues = z.infer<typeof floorSchema>
export type FloorRecord = FloorFormValues & { id: string }

export function FloorFormDialog({
  floor,
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  floor?: FloorRecord
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (floor: FloorRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const form = useForm<FloorFormValues>({
    resolver: zodResolver(floorSchema),
    defaultValues: { name: floor?.name ?? "" },
  })

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset({ name: floor?.name ?? "" })
    }
  }, [dialogOpen, floor, form])

  const onSubmit = async (values: FloorFormValues) => {
    const url = floor ? `/api/floors/${floor.id}` : "/api/floors"
    const method = floor ? "PATCH" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to save floor."))
      return
    }

    const saved = (await res.json()) as FloorRecord
    toast.success(floor ? "Floor updated." : "Floor created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{floor ? "Edit floor" : "New floor"}</DialogTitle>
          <DialogDescription>Floors group tables in the POS floor pop-up.</DialogDescription>
        </DialogHeader>
        <form id="floor-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="floor-name">Name</FieldLabel>
                  <Input id="floor-name" placeholder="Ground Floor" {...field} aria-invalid={fieldState.invalid} />
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
          <Button type="submit" form="floor-form" disabled={form.formState.isSubmitting}>
            {floor ? "Save changes" : "Create floor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
