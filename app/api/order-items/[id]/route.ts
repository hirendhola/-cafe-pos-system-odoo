import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { recomputeOrderTotals } from "@/lib/pricing";

const updateSchema = z
  .object({
    kdsStatus: z.enum(["TO_COOK", "PREPARING", "COMPLETED"]).optional(),
    qty: z.number().int().positive().optional(),
  })
  .refine((data) => data.kdsStatus !== undefined || data.qty !== undefined, {
    message: "Provide kdsStatus or qty",
  });

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.orderItem.findUnique({ where: { id }, include: { order: true } });
  if (!item) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  if (parsed.data.qty !== undefined && item.order.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft orders can be edited." }, { status: 409 });
  }

  const data: { kdsStatus?: "TO_COOK" | "PREPARING" | "COMPLETED"; kdsItemDone?: boolean; qty?: number } = {};

  if (parsed.data.kdsStatus) {
    data.kdsStatus = parsed.data.kdsStatus;
    data.kdsItemDone = parsed.data.kdsStatus === "COMPLETED";
  }

  if (parsed.data.qty !== undefined) {
    data.qty = parsed.data.qty;
  }

  await prisma.orderItem.update({ where: { id }, data });

  if (parsed.data.qty !== undefined) {
    const updatedOrder = await recomputeOrderTotals(item.orderId);
    return NextResponse.json(updatedOrder);
  }

  const updatedItem = await prisma.orderItem.findUniqueOrThrow({ where: { id } });
  return NextResponse.json(updatedItem);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const item = await prisma.orderItem.findUnique({ where: { id }, include: { order: true } });
  if (!item) {
    return NextResponse.json({ error: "Order item not found" }, { status: 404 });
  }

  if (item.order.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft orders can be edited." }, { status: 409 });
  }

  await prisma.orderItem.delete({ where: { id } });

  const updatedOrder = await recomputeOrderTotals(item.orderId);
  return NextResponse.json(updatedOrder);
}
