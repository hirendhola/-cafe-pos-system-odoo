import { endOfDay, startOfDay, subDays } from "date-fns"

import { KpiCards } from "./_components/kpi-cards"
import { RecentOrdersTable } from "./_components/recent-orders-table"
import { CategoryBreakdownChart } from "@/components/admin/charts/category-breakdown-chart"
import { PaymentBreakdownChart } from "@/components/admin/charts/payment-breakdown-chart"
import { SalesTrendChart } from "@/components/admin/charts/sales-trend-chart"
import { TopProductsChart } from "@/components/admin/charts/top-products-chart"
import { prisma } from "@/lib/db"
import { computeSessionCashSummary } from "@/lib/pos-session"
import { buildSalesTrend, getItemReport, getPaidOrders, summarizeNetSales } from "@/lib/reports"

export default async function AdminDashboardPage() {
  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const yesterdayStart = startOfDay(subDays(now, 1))
  const yesterdayEnd = endOfDay(subDays(now, 1))
  const last30Start = startOfDay(subDays(now, 29))

  const [todayOrders, yesterdayOrders, last30Orders, openSession, recentOrders] = await Promise.all([
    getPaidOrders({ from: todayStart, to: todayEnd }),
    getPaidOrders({ from: yesterdayStart, to: yesterdayEnd }),
    getPaidOrders({ from: last30Start, to: todayEnd }),
    prisma.posSession.findFirst({ where: { closedAt: null } }),
    prisma.order.findMany({
      where: { status: "PAID" },
      include: {
        table: { include: { floor: true } },
        customer: true,
        paidBy: { select: { name: true } },
      },
      orderBy: { paidAt: "desc" },
      take: 8,
    }),
  ])

  const todaySummary = summarizeNetSales(todayOrders)
  const yesterdaySummary = summarizeNetSales(yesterdayOrders)
  const last30Summary = summarizeNetSales(last30Orders)
  const trend = buildSalesTrend(last30Orders, last30Start, todayEnd)
  const { items, categories } = getItemReport(last30Orders)

  const session = openSession ? await computeSessionCashSummary(openSession.id, openSession.openingAmount) : null

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of today&apos;s performance and the last 30 days.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-12">
          <KpiCards
            today={todaySummary}
            yesterday={yesterdaySummary}
            session={
              openSession && session
                ? { openedAt: openSession.openedAt.toISOString(), expectedCash: session.expectedCash }
                : null
            }
          />
        </div>

        <div className="xl:col-span-7">
          <SalesTrendChart
            data={trend.map((point) => ({ label: point.label, netSales: point.netSales, orders: point.orders }))}
            title="Sales Overview (Last 30 Days)"
          />
        </div>

        <div className="xl:col-span-5">
          <PaymentBreakdownChart data={last30Summary.byPaymentType} title="Payment Methods (Last 30 Days)" />
        </div>

        <div className="xl:col-span-6">
          <TopProductsChart
            data={items.slice(0, 5).map((item) => ({ name: item.name, netRevenue: item.netRevenue }))}
            title="Top Products (Last 30 Days)"
          />
        </div>

        <div className="xl:col-span-6">
          <CategoryBreakdownChart data={categories} title="Sales by Category (Last 30 Days)" />
        </div>

        <div className="xl:col-span-12">
          <RecentOrdersTable
            orders={recentOrders.map((order) => ({ ...order, paidAt: order.paidAt?.toISOString() ?? null }))}
          />
        </div>
      </div>
    </div>
  )
}
