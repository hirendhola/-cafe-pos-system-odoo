"use client"

import { EmployeesReport } from "./employees-report"
import { ItemsReport } from "./items-report"
import { NetSalesReport } from "./net-sales-report"
import { OrdersReport } from "./orders-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

function ComingSoon({ label }: { label: string }) {
  return <p className="py-12 text-center text-sm text-muted-foreground">The {label} report is coming up next.</p>
}

export function ReportsView({
  employees,
  categories,
}: {
  employees: { id: string; name: string }[]
  categories: { id: string; name: string }[]
}) {
  return (
    <Tabs defaultValue="net-sales">
      <TabsList className="flex-wrap">
        <TabsTrigger value="net-sales">Net Sales</TabsTrigger>
        <TabsTrigger value="orders">Orders</TabsTrigger>
        <TabsTrigger value="employees">Employees</TabsTrigger>
        <TabsTrigger value="items">Items</TabsTrigger>
        <TabsTrigger value="discounts">Discounts &amp; Promotions</TabsTrigger>
        <TabsTrigger value="sessions">Sessions</TabsTrigger>
      </TabsList>

      <TabsContent value="net-sales" className="mt-4">
        <NetSalesReport />
      </TabsContent>
      <TabsContent value="orders" className="mt-4">
        <OrdersReport employees={employees} />
      </TabsContent>
      <TabsContent value="employees" className="mt-4">
        <EmployeesReport />
      </TabsContent>
      <TabsContent value="items" className="mt-4">
        <ItemsReport categories={categories} />
      </TabsContent>
      <TabsContent value="discounts" className="mt-4">
        <ComingSoon label="Discounts & Promotions" />
      </TabsContent>
      <TabsContent value="sessions" className="mt-4">
        <ComingSoon label="Sessions" />
      </TabsContent>
    </Tabs>
  )
}
