"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { currency } from "@/lib/format"

const chartConfig = {
  netRevenue: { label: "Net revenue", color: "var(--chart-1)" },
} satisfies ChartConfig

export function TopProductsChart({
  data,
  title = "Top Products",
}: {
  data: { name: string; netRevenue: number }[]
  title?: string
}) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No sales in this period.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <BarChart accessibilityLayer data={data} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={120}
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    hideLabel
                    formatter={(value) => (
                      <span className="font-mono font-medium tabular-nums">{currency.format(Number(value))}</span>
                    )}
                  />
                }
              />
              <Bar dataKey="netRevenue" fill="var(--color-netRevenue)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
