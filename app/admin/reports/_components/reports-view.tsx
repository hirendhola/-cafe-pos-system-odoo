"use client"

import { DiscountsReport } from "./discounts-report"
import { EmployeesReport } from "./employees-report"
import { ItemsReport } from "./items-report"
import { NetSalesReport } from "./net-sales-report"
import { OrdersReport } from "./orders-report"
import { SessionsReport } from "./sessions-report"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
        <DiscountsReport />
      </TabsContent>
      <TabsContent value="sessions" className="mt-4">
        <SessionsReport />
      </TabsContent>
    </Tabs>
  )
}
