"use client"

import * as React from "react"

import { MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"

import { FloorFormDialog, type FloorRecord } from "@/components/admin/floor-form-dialog"
import { TableFormDialog, type TableRecord } from "@/components/admin/table-form-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { extractErrorMessage } from "@/lib/form-error"

type FloorWithTables = FloorRecord & { tables: TableRecord[] }

export function FloorsTablesView({ initialFloors }: { initialFloors: FloorWithTables[] }) {
  const [floors, setFloors] = React.useState(initialFloors)
  const [editingFloor, setEditingFloor] = React.useState<FloorRecord | null>(null)
  const [editingTable, setEditingTable] = React.useState<{ floorId: string; table: TableRecord } | null>(null)

  const handleDeleteFloor = async (floor: FloorRecord) => {
    if (!confirm(`Delete floor "${floor.name}" and all its tables?`)) return

    const res = await fetch(`/api/floors/${floor.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete floor."))
      return
    }

    setFloors((prev) => prev.filter((f) => f.id !== floor.id))
    toast.success("Floor deleted.")
  }

  const handleDeleteTable = async (floorId: string, table: TableRecord) => {
    if (!confirm(`Delete table ${table.number}?`)) return

    const res = await fetch(`/api/tables/${table.id}`, { method: "DELETE" })

    if (!res.ok) {
      const data = await res.json().catch(() => null)
      toast.error(extractErrorMessage(data, "Failed to delete table."))
      return
    }

    setFloors((prev) =>
      prev.map((f) => (f.id === floorId ? { ...f, tables: f.tables.filter((t) => t.id !== table.id) } : f)),
    )
    toast.success("Table deleted.")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium">Floors & Tables</h1>
          <p className="text-sm text-muted-foreground">Organize seating for the POS floor pop-up.</p>
        </div>
        <FloorFormDialog
          trigger={
            <Button size="sm">
              <Plus /> Add floor
            </Button>
          }
          onSaved={(saved) =>
            setFloors((prev) => [...prev, { ...saved, tables: [] }].sort((a, b) => a.name.localeCompare(b.name)))
          }
        />
      </div>

      {floors.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No floors yet. Add a floor to start placing tables.
          </CardContent>
        </Card>
      ) : (
        floors.map((floor) => (
          <Card key={floor.id}>
            <CardHeader className="border-b">
              <CardTitle>{floor.name}</CardTitle>
              <CardDescription>
                {floor.tables.length} table{floor.tables.length === 1 ? "" : "s"}
              </CardDescription>
              <CardAction className="flex items-center gap-2">
                <TableFormDialog
                  floorId={floor.id}
                  trigger={
                    <Button size="sm" variant="outline">
                      <Plus /> Add table
                    </Button>
                  }
                  onSaved={(saved) =>
                    setFloors((prev) =>
                      prev.map((f) =>
                        f.id === floor.id
                          ? { ...f, tables: [...f.tables, saved].sort((a, b) => a.number - b.number) }
                          : f,
                      ),
                    )
                  }
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon-sm" variant="ghost" aria-label={`Actions for ${floor.name}`}>
                      <MoreHorizontal />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setEditingFloor(floor)}>Rename</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteFloor(floor)}>
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardAction>
            </CardHeader>
            <CardContent>
              {floor.tables.length === 0 ? (
                <p className="text-sm text-muted-foreground">No tables on this floor yet.</p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {floor.tables.map((table) => (
                    <div key={table.id} className="flex items-center gap-2 rounded-2xl border p-3">
                      <div>
                        <div className="font-medium">Table {table.number}</div>
                        <div className="text-xs text-muted-foreground">{table.seats} seats</div>
                      </div>
                      <Badge variant={table.active ? "default" : "outline"}>
                        {table.active ? "Active" : "Inactive"}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost" aria-label={`Actions for table ${table.number}`}>
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => setEditingTable({ floorId: floor.id, table })}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteTable(floor.id, table)}>
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}

      {editingFloor ? (
        <FloorFormDialog
          floor={editingFloor}
          open={!!editingFloor}
          onOpenChange={(open) => !open && setEditingFloor(null)}
          onSaved={(saved) => {
            setFloors((prev) => prev.map((f) => (f.id === saved.id ? { ...f, ...saved } : f)))
            setEditingFloor(null)
          }}
        />
      ) : null}

      {editingTable ? (
        <TableFormDialog
          floorId={editingTable.floorId}
          table={editingTable.table}
          open={!!editingTable}
          onOpenChange={(open) => !open && setEditingTable(null)}
          onSaved={(saved) => {
            const { floorId } = editingTable
            setFloors((prev) =>
              prev.map((f) =>
                f.id === floorId
                  ? { ...f, tables: f.tables.map((t) => (t.id === saved.id ? saved : t)).sort((a, b) => a.number - b.number) }
                  : f,
              ),
            )
            setEditingTable(null)
          }}
        />
      ) : null}
    </div>
  )
}
