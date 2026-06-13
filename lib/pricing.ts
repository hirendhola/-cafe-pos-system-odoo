import { prisma } from "@/lib/db";

type PricedItem = {
  unitPrice: number;
  qty: number;
  lineDiscount: number;
  product: { tax: number };
};

export function computeOrderTotals(items: PricedItem[], orderDiscount: number) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.qty - item.lineDiscount, 0);
  const tax = items.reduce(
    (sum, item) => sum + (item.unitPrice * item.qty - item.lineDiscount) * (item.product.tax / 100),
    0,
  );
  const total = subtotal + tax - orderDiscount;

  return { subtotal, tax, total };
}

export async function recomputeOrderTotals(orderId: string) {
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const items = await prisma.orderItem.findMany({ where: { orderId }, include: { product: true } });
  const { subtotal, tax, total } = computeOrderTotals(items, order.discount);

  return prisma.order.update({
    where: { id: orderId },
    data: { subtotal, tax, total },
    include: {
      items: { include: { product: { include: { category: true } } }, orderBy: { createdAt: "asc" } },
      table: { include: { floor: true } },
      customer: true,
    },
  });
}
