import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { recomputeOrderTotals } from "@/lib/pricing";

const applySchema = z.object({ code: z.string().min(1, "Enter a coupon code") });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = applySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "DRAFT") {
    return NextResponse.json({ error: "Only draft orders can be edited." }, { status: 409 });
  }

  const coupon = await prisma.coupon.findUnique({ where: { code: parsed.data.code.trim().toUpperCase() } });

  if (!coupon || !coupon.active) {
    return NextResponse.json({ error: "Invalid or inactive coupon code." }, { status: 404 });
  }

  await prisma.order.update({ where: { id }, data: { couponId: coupon.id } });

  const updated = await recomputeOrderTotals(id);

  return NextResponse.json({ ...updated, coupon });
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
    return NextResponse.json({ error: "Only draft orders can be edited." }, { status: 409 });
  }

  await prisma.order.update({ where: { id }, data: { couponId: null } });

  const updated = await recomputeOrderTotals(id);

  return NextResponse.json({ ...updated, coupon: null });
}
