"use client"

import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { currency, number } from "@/lib/format"

export type SalesTrendDatum = {
  label: string
  netSales: number
  orders: number
}

const chartConfig = {
  netSales: { label: "Net sales", color: "var(--chart-1)" },
  orders: { label: "Orders", color: "var(--chart-3)" },
} satisfies ChartConfig

export function SalesTrendChart({ data, title = "Sales Overview" }: { data: SalesTrendDatum[]; title?: string }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
          <ComposedChart accessibilityLayer data={data} margin={{ left: 0, right: 0, top: 8, bottom: 0 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tickMargin={8} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="netSales" hide />
            <YAxis yAxisId="orders" orientation="right" hide />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                      <span className="text-muted-foreground">{name === "netSales" ? "Net sales" : "Orders"}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {name === "netSales" ? currency.format(Number(value)) : number.format(Number(value))}
                      </span>
                    </div>
                  )}
                />
              }
            />
            <Area
              yAxisId="netSales"
              dataKey="netSales"
              name="netSales"
              type="monotone"
              fill="var(--color-netSales)"
              fillOpacity={0.15}
              stroke="var(--color-netSales)"
              strokeWidth={2}
            />
            <Line
              yAxisId="orders"
              dataKey="orders"
              name="orders"
              type="monotone"
              stroke="var(--color-orders)"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
