"use client"

import * as React from "react"

import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { ChangePasswordDialog } from "@/components/admin/change-password-dialog"
import { UserFormDialog, type UserRecord } from "@/components/admin/user-form-dialog"
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

export function UsersView({ initialUsers, currentUserId }: { initialUsers: UserRecord[]; currentUserId: string }) {
  const [users, setUsers] = React.useState(initialUsers)
  const [passwordTarget, setPasswordTarget] = React.useState<UserRecord | null>(null)

  const handleToggleArchive = async (user: UserRecord) => {
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !user.archived }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to update user."))
      return
    }

    const saved = (await res.json()) as UserRecord
    setUsers((prev) => prev.map((u) => (u.id === saved.id ? saved : u)))
    toast.success(saved.archived ? "User archived." : "User reactivated.")
  }

  const handleDelete = async (user: UserRecord) => {
    if (!confirm(`Delete user "${user.name}"? This cannot be undone.`)) return

    const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete user."))
      return
    }

    setUsers((prev) => prev.filter((u) => u.id !== user.id))
    toast.success("User deleted.")
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Users</CardTitle>
        <CardDescription>Manage admin and employee accounts that can sign in to the POS.</CardDescription>
        <CardAction>
          <UserFormDialog
            trigger={
              <Button size="sm">
                <Plus /> Add user
              </Button>
            }
            onSaved={(saved) => setUsers((prev) => [...prev, saved])}
          />
        </CardAction>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  No users yet.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelf = user.id === currentUserId

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.name}
                      {isSelf ? <span className="ml-2 text-xs text-muted-foreground">(You)</span> : null}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
                        {user.role === "ADMIN" ? "Admin" : "Employee"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.archived ? "destructive" : "outline"}>
                        {user.archived ? "Archived" : "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${user.name}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setPasswordTarget(user)}>Change password</DropdownMenuItem>
                          <DropdownMenuItem disabled={isSelf} onSelect={() => handleToggleArchive(user)}>
                            {user.archived ? "Unarchive" : "Archive"}
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" disabled={isSelf} onSelect={() => handleDelete(user)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>

      {passwordTarget ? (
        <ChangePasswordDialog
          userId={passwordTarget.id}
          userName={passwordTarget.name}
          open={!!passwordTarget}
          onOpenChange={(open) => !open && setPasswordTarget(null)}
        />
      ) : null}
    </Card>
  )
}
