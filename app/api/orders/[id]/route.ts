import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const updateOrderSchema = z.object({
  customerId: z.string().min(1).nullable(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
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

  const updated = await prisma.order.update({
    where: { id },
    data: { customerId: parsed.data.customerId },
    include: { customer: true },
  });

  return NextResponse.json(updated);
}
