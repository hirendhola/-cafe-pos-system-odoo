"use client"

import { Cell, Pie, PieChart } from "recharts"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { currency } from "@/lib/format"

const chartConfig = {
  CASH: { label: "Cash", color: "var(--chart-1)" },
  CARD: { label: "Card", color: "var(--chart-2)" },
  UPI: { label: "UPI", color: "var(--chart-3)" },
} satisfies ChartConfig

export function PaymentBreakdownChart({
  data,
  title = "Payment Methods",
}: {
  data: { CASH: number; CARD: number; UPI: number }
  title?: string
}) {
  const chartData = (["CASH", "CARD", "UPI"] as const).map((type) => ({
    type,
    amount: data[type],
    fill: `var(--color-${type})`,
  }))

  const total = data.CASH + data.CARD + data.UPI

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="flex h-72 items-center justify-center text-sm text-muted-foreground">No payments in this period.</p>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
            <PieChart accessibilityLayer>
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    nameKey="type"
                    formatter={(value, name) => (
                      <div className="flex flex-1 items-center justify-between gap-3 leading-none">
                        <span className="text-muted-foreground">{chartConfig[name as keyof typeof chartConfig]?.label}</span>
                        <span className="font-mono font-medium tabular-nums">{currency.format(Number(value))}</span>
                      </div>
                    )}
                  />
                }
              />
              <Pie data={chartData} dataKey="amount" nameKey="type" innerRadius={60} strokeWidth={4}>
                {chartData.map((entry) => (
                  <Cell key={entry.type} fill={entry.fill} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-4 text-xs">
          {chartData.map((entry) => (
            <div key={entry.type} className="flex items-center gap-1.5">
              <div className="size-2 rounded-[2px]" style={{ backgroundColor: entry.fill }} />
              <span className="text-muted-foreground">{chartConfig[entry.type].label}</span>
              <span className="font-medium tabular-nums">{currency.format(entry.amount)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
