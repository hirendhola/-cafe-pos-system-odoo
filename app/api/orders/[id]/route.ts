import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const updateOrderSchema = z.union([
  z.object({ customerId: z.string().min(1).nullable() }),
  z.object({ status: z.literal("CANCELLED") }),
]);

const orderDetailInclude = {
  items: { include: { product: { include: { category: true } } }, orderBy: { createdAt: "asc" as const } },
  table: { include: { floor: true } },
  customer: true,
  session: true,
  coupon: true,
  createdBy: { select: { name: true } },
  paidBy: { select: { name: true } },
};

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id }, include: orderDetailInclude });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  return NextResponse.json(order);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateOrderSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if ("status" in parsed.data) {
    if (user!.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (order.status !== "PAID") {
      return NextResponse.json({ error: "Only paid orders can be cancelled." }, { status: 409 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED", cancelledAt: new Date() },
      include: orderDetailInclude,
    });

    return NextResponse.json(updated);
  }

  const updated = await prisma.order.update({
    where: { id },
    data: { customerId: parsed.data.customerId },
    include: { customer: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft orders can be deleted." }, { status: 409 });
  }

  await prisma.order.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
