import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { OrderStatus } from "@/generated/prisma/enums";
import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { computeOrderTotals } from "@/lib/pricing";

const ORDER_STATUSES = Object.values(OrderStatus);

export async function GET(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const q = searchParams.get("q")?.trim();
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const sessionId = searchParams.get("sessionId");
  const employeeId = searchParams.get("employeeId");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const where: Prisma.OrderWhereInput = {};

  if (status && (ORDER_STATUSES as string[]).includes(status)) {
    where.status = status as OrderStatus;
  }

  if (sessionId) where.sessionId = sessionId;
  if (employeeId) where.createdById = employeeId;

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  if (q) {
    where.OR = [
      { number: { contains: q, mode: "insensitive" } },
      { customer: { name: { contains: q, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        table: { include: { floor: true } },
        customer: true,
        createdBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total });
}

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
  const { user, response } = await requireUser();
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
      const openSession = await tx.posSession.findFirst({ where: { closedAt: null } });
      order = await tx.order.create({
        data: {
          number: `ORD-${String(count + 1).padStart(4, "0")}`,
          tableId,
          customerId: customerId ?? undefined,
          status: "DRAFT",
          createdById: user!.id,
          sessionId: openSession?.id,
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

    const { subtotal, tax, total } = computeOrderTotals(allItems, order.discount);

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
