"use client"

import { Cell, Pie, PieChart } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { number } from "@/lib/format"

const chartConfig = {
  PAID: { label: "Paid", color: "var(--chart-1)" },
  DRAFT: { label: "Draft", color: "var(--chart-3)" },
  CANCELLED: { label: "Cancelled", color: "var(--chart-5)" },
} satisfies ChartConfig

export function OrderStatusChart({
  data,
  title = "Order Status",
}: {
  data: { PAID: number; DRAFT: number; CANCELLED: number }
  title?: string
}) {
  const chartData = (["PAID", "DRAFT", "CANCELLED"] as const).map((status) => ({
    status,
    count: data[status],
    fill: `var(--color-${status})`,
  }))

  const total = data.PAID + data.DRAFT + data.CANCELLED

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No orders in this period.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="status"
                    formatter={(value, name) => (
                      <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                        <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                        <span className="font-mono font-medium tabular-nums">{number.format(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Pie data={chartData} dataKey="count" nameKey="status" innerRadius={60} strokeWidth={4}>
                {chartData.map((entry) => (
                  <Cell key={entry.status} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          {chartData.map((entry) => (
            <div key={entry.status} className="flex items-center gap-1.5">
              <div className="size-2 rounded-xs" style={{ backgroundColor: entry.fill }} />
              <span className="text-muted-foreground">{chartConfig[entry.status].label}</span>
              <span className="font-medium tabular-nums">{number.format(entry.count)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
