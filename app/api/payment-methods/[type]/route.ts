import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const PAYMENT_TYPES = ["CASH", "CARD", "UPI"] as const;

const updateSchema = z.object({
  enabled: z.boolean().optional(),
  upiId: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { type } = await params;
  if (!PAYMENT_TYPES.includes(type as (typeof PAYMENT_TYPES)[number])) {
    return NextResponse.json({ error: "Invalid payment type" }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data: { enabled?: boolean; upiId?: string | null } = {};
  if (parsed.data.enabled !== undefined) data.enabled = parsed.data.enabled;
  if (parsed.data.upiId !== undefined) data.upiId = parsed.data.upiId?.trim() || null;

  const paymentType = type as (typeof PAYMENT_TYPES)[number];
  const method = await prisma.paymentMethod.upsert({
    where: { type: paymentType },
    create: { type: paymentType, ...data },
    update: data,
  });

  return NextResponse.json(method);
}
