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
import { extractErrorMessage } from "@/lib/form-error"

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
})

export type UserFormValues = z.infer<typeof userFormSchema>

export type UserRecord = {
  id: string
  name: string
  email: string
  role: "ADMIN" | "EMPLOYEE"
  archived: boolean
  createdAt: string
}

const defaultValues: UserFormValues = { name: "", email: "", password: "", role: "EMPLOYEE" }

export function UserFormDialog({
  open,
  onOpenChange,
  trigger,
  onSaved,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
  onSaved?: (user: UserRecord) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen

  const setDialogOpen = (value: boolean) => {
    onOpenChange?.(value)
    if (!isControlled) setInternalOpen(value)
  }

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues,
  })

  React.useEffect(() => {
    if (dialogOpen) {
      form.reset(defaultValues)
    }
  }, [dialogOpen, form])

  const onSubmit = async (values: UserFormValues) => {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to create user."))
      return
    }

    const saved = (await res.json()) as UserRecord
    toast.success("User created.")
    setDialogOpen(false)
    onSaved?.(saved)
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New user</DialogTitle>
          <DialogDescription>Create a login for a cashier or admin.</DialogDescription>
        </DialogHeader>
        <form id="user-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-name">Name</FieldLabel>
                  <Input id="user-name" placeholder="Jane Doe" {...field} aria-invalid={fieldState.invalid} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="email"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-email">Email</FieldLabel>
                  <Input
                    id="user-email"
                    type="email"
                    placeholder="jane@cafe.com"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-password">Password</FieldLabel>
                  <Input
                    id="user-password"
                    type="password"
                    autoComplete="new-password"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
            <Controller
              control={form.control}
              name="role"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="user-role">Role</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="user-role" className="w-full" aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee / Cashier</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
          <Button type="submit" form="user-form" disabled={form.formState.isSubmitting}>
            Create user
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
