import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const querySchema = z.object({
  from: z.string(),
  to: z.string(),
});

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ from: searchParams.get("from"), to: searchParams.get("to") });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: from, lte: to } },
    select: { status: true, tableId: true },
  });

  const byStatus = { DRAFT: 0, PAID: 0, CANCELLED: 0 };
  let dineIn = 0;
  let takeaway = 0;

  for (const order of orders) {
    byStatus[order.status] += 1;
    if (order.tableId) dineIn += 1;
    else takeaway += 1;
  }

  return NextResponse.json({ total: orders.length, byStatus, dineIn, takeaway });
}
