import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { getItemReport, getPaidOrders } from "@/lib/reports";

const querySchema = z.object({
  from: z.string(),
  to: z.string(),
  categoryId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    from: searchParams.get("from"),
    to: searchParams.get("to"),
    categoryId: searchParams.get("categoryId") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const from = new Date(parsed.data.from);
  const to = new Date(parsed.data.to);

  const orders = await getPaidOrders({ from, to });
  const { items, categories } = getItemReport(orders, parsed.data.categoryId);

  return NextResponse.json({ items, categories });
}
