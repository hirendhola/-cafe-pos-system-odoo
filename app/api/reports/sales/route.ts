import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { buildSalesTrend, getItemReport, getPaidOrders, summarizeNetSales } from "@/lib/reports";

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

  const orders = await getPaidOrders({ from, to });
  const summary = summarizeNetSales(orders);
  const trend = buildSalesTrend(orders, from, to);
  const { categories } = getItemReport(orders);

  return NextResponse.json({ summary, trend, categories });
}
