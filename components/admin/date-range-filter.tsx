"use client"

import * as React from "react"

import { endOfDay, format, startOfDay, startOfMonth, subDays } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export type DateRangeValue = { from: Date; to: Date }

const PRESETS: { label: string; getRange: () => DateRangeValue }[] = [
  { label: "Today", getRange: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
  { label: "7D", getRange: () => ({ from: startOfDay(subDays(new Date(), 6)), to: endOfDay(new Date()) }) },
  { label: "30D", getRange: () => ({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) }) },
  { label: "This month", getRange: () => ({ from: startOfMonth(new Date()), to: endOfDay(new Date()) }) },
]

export function defaultDateRange(): DateRangeValue {
  return PRESETS[2].getRange()
}

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: DateRangeValue
  onChange: (range: DateRangeValue) => void
}) {
  const [open, setOpen] = React.useState(false)

  const activePreset = PRESETS.find((preset) => {
    const range = preset.getRange()
    return startOfDay(range.from).getTime() === startOfDay(value.from).getTime() && startOfDay(range.to).getTime() === startOfDay(value.to).getTime()
  })?.label

  return (
    <div className="flex flex-wrap items-center gap-2">
      {PRESETS.map((preset) => (
        <Button
          key={preset.label}
          type="button"
          size="sm"
          variant={activePreset === preset.label ? "default" : "outline"}
          onClick={() => onChange(preset.getRange())}
        >
          {preset.label}
        </Button>
      ))}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" size="sm" variant={activePreset ? "outline" : "default"} className="justify-start font-normal">
            <CalendarIcon />
            {format(value.from, "dd MMM yyyy")} - {format(value.to, "dd MMM yyyy")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{ from: value.from, to: value.to }}
            onSelect={(range) => {
              if (!range?.from) return
              onChange({ from: startOfDay(range.from), to: range.to ? endOfDay(range.to) : endOfDay(range.from) })
              if (range.to) setOpen(false)
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
