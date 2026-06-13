"use client"

import * as React from "react"

import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { extractErrorMessage } from "@/lib/form-error"

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
})

type PasswordFormValues = z.infer<typeof passwordSchema>

export function ChangePasswordDialog({
  userId,
  userName,
  open,
  onOpenChange,
}: {
  userId: string
  userName: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "" },
  })

  React.useEffect(() => {
    if (open) {
      form.reset({ password: "" })
    }
  }, [open, form])

  const onSubmit = async (values: PasswordFormValues) => {
    const res = await fetch(`/api/users/${userId}/password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to change password."))
      return
    }

    toast.success("Password updated.")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
          <DialogDescription>Set a new password for {userName}.</DialogDescription>
        </DialogHeader>
        <form id="change-password-form" noValidate onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup className="gap-4">
            <Controller
              control={form.control}
              name="password"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="new-password">New password</FieldLabel>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form="change-password-form" disabled={form.formState.isSubmitting}>
            Update password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
