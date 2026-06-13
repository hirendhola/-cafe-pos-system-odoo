"use client"

import { ChevronDown, Download, FileSpreadsheet, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { downloadCsv, toCsv, type CsvColumn } from "@/lib/csv"
import { downloadXlsx } from "@/lib/xlsx-export"

export function ExportMenu<T extends Record<string, unknown>>({
  data,
  columns,
  filename,
  sheetName,
  label = "Export",
}: {
  data: T[] | null | undefined
  columns: CsvColumn<T>[]
  filename: string
  sheetName?: string
  label?: string
}) {
  const rows = data ?? []
  const disabled = rows.length === 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Download /> {label}
          <ChevronDown className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuLabel>Download report as</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => downloadCsv(`${filename}.csv`, toCsv(rows, columns))}>
          <FileText /> CSV
          <span className="ml-auto text-xs text-muted-foreground">.csv</span>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => downloadXlsx(`${filename}.xlsx`, rows, columns, sheetName)}>
          <FileSpreadsheet /> Excel
          <span className="ml-auto text-xs text-muted-foreground">.xlsx</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
