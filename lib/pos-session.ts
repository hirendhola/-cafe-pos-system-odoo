import { prisma } from "@/lib/db";

export async function computeSessionCashSummary(sessionId: string, openingAmount: number) {
  const paidOrders = await prisma.order.findMany({
    where: { sessionId, status: "PAID" },
    select: { total: true, paymentType: true },
  });

  const sumBy = (type: "CASH" | "CARD" | "UPI") =>
    paidOrders.filter((order) => order.paymentType === type).reduce((sum, order) => sum + order.total, 0);

  const cashSales = sumBy("CASH");
  const cardSales = sumBy("CARD");
  const upiSales = sumBy("UPI");
  const grandTotal = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const expectedCash = openingAmount + cashSales;

  return {
    openingAmount,
    cashSales,
    cardSales,
    upiSales,
    ordersCount: paidOrders.length,
    grandTotal,
    expectedCash,
  };
}
