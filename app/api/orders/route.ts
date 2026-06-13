import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const createOrderSchema = z.object({
  tableId: z.string().min(1).optional(),
  customerId: z.string().min(1).optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1),
        qty: z.number().int().positive(),
      }),
    )
    .min(1, "Add at least one item"),
});

export async function POST(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = createOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { tableId, customerId, items } = parsed.data;

  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
  });

  const productMap = new Map(products.map((product) => [product.id, product]));

  for (const item of items) {
    if (!productMap.has(item.productId)) {
      return NextResponse.json({ error: "One or more products were not found." }, { status: 400 });
    }
  }

  const order = await prisma.$transaction(async (tx) => {
    let order = tableId ? await tx.order.findFirst({ where: { tableId, status: "DRAFT" } }) : null;

    if (!order) {
      const count = await tx.order.count();
      order = await tx.order.create({
        data: {
          number: `ORD-${String(count + 1).padStart(4, "0")}`,
          tableId,
          customerId: customerId ?? undefined,
          status: "DRAFT",
        },
      });
    } else if (customerId !== undefined && customerId !== order.customerId) {
      order = await tx.order.update({ where: { id: order.id }, data: { customerId } });
    }

    await tx.orderItem.createMany({
      data: items.map((item) => {
        const product = productMap.get(item.productId)!;
        return {
          orderId: order!.id,
          productId: item.productId,
          qty: item.qty,
          unitPrice: product.price,
          kdsStatus: "TO_COOK" as const,
        };
      }),
    });

    const allItems = await tx.orderItem.findMany({
      where: { orderId: order.id },
      include: { product: true },
    });

    const subtotal = allItems.reduce((sum, item) => sum + item.unitPrice * item.qty - item.lineDiscount, 0);
    const tax = allItems.reduce(
      (sum, item) => sum + (item.unitPrice * item.qty - item.lineDiscount) * (item.product.tax / 100),
      0,
    );
    const total = subtotal + tax - order.discount;

    return tx.order.update({
      where: { id: order.id },
      data: { subtotal, tax, total },
      include: {
        items: { include: { product: { include: { category: true } } }, orderBy: { createdAt: "asc" } },
        table: { include: { floor: true } },
        customer: true,
      },
    });
  });

  return NextResponse.json(order, { status: 201 });
}
