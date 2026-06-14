"use client"

import * as React from "react"

import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

export type FloorWithTables = {
  id: string
  name: string
  tables: {
    id: string
    number: number
    seats: number
    orders: { id: string; number: string }[]
  }[]
}

export function FloorTablePopup({
  floors,
  open,
  onOpenChange,
  selectedTableId,
}: {
  floors: FloorWithTables[]
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedTableId: string | null
}) {
  const router = useRouter()

  const handleSelect = (tableId: string) => {
    router.push(`/pos?table=${tableId}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Select a table</DialogTitle>
          <DialogDescription>Choose a table to start or continue an order.</DialogDescription>
        </DialogHeader>

        {floors.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No floors or tables yet. Add them from the admin panel.
          </p>
        ) : (
          <Tabs defaultValue={floors[0].id}>
            <TabsList className="max-w-full overflow-x-auto">
              {floors.map((floor) => (
                <TabsTrigger key={floor.id} value={floor.id}>
                  {floor.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {floors.map((floor) => (
              <TabsContent key={floor.id} value={floor.id}>
                {floor.tables.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">No tables on this floor.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3 py-2 sm:grid-cols-3 md:grid-cols-4">
                    {floor.tables.map((table) => {
                      const isOccupied = table.orders.length > 0
                      const isSelected = table.id === selectedTableId

                      return (
                        <button
                          key={table.id}
                          type="button"
                          onClick={() => handleSelect(table.id)}
                          className={cn(
                            "flex flex-col items-center gap-1 rounded-xl border p-3 text-sm transition-colors hover:border-primary",
                            isOccupied ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "border-dashed",
                            isSelected && "ring-2 ring-primary",
                          )}
                        >
                          <span className="text-base font-semibold">Table {table.number}</span>
                          <span className="text-xs text-muted-foreground">{table.seats} seats</span>
                          <Badge variant={isOccupied ? "default" : "outline"} className="mt-1">
                            {isOccupied ? "Occupied" : "Free"}
                          </Badge>
                        </button>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
