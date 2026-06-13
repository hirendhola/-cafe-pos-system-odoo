"use client"

import { Cell, Pie, PieChart } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { currency } from "@/lib/format"

export function CategoryBreakdownChart({
  data,
  title = "Sales by Category",
}: {
  data: { categoryId: string; name: string; color: string; netRevenue: number }[]
  title?: string
}) {
  const total = data.reduce((sum, cat) => sum + cat.netRevenue, 0)

  const config: ChartConfig = Object.fromEntries(data.map((cat) => [cat.categoryId, { label: cat.name, color: cat.color }]))

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <ChartContainer config={config} className="aspect-auto h-72 w-full">
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="categoryId"
                    formatter={(value, name) => (
                      <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                        <span className="text-muted-foreground">{config[name as string]?.label}</span>
                        <span className="font-mono font-medium tabular-nums">{currency.format(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Pie data={data} dataKey="netRevenue" nameKey="categoryId" innerRadius={60} strokeWidth={4}>
                {data.map((entry) => (
                  <Cell key={entry.categoryId} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          {data.map((cat) => (
            <div key={cat.categoryId} className="flex items-center gap-1.5">
              <div className="size-2 rounded-[2px]" style={{ backgroundColor: cat.color }} />
              <span className="text-muted-foreground">{cat.name}</span>
              <span className="font-medium tabular-nums">{currency.format(cat.netRevenue)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
