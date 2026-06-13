import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { computeSessionCashSummary } from "@/lib/pos-session";

const closeSchema = z.object({
  closingAmount: z.number().nonnegative(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = closeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const session = await prisma.posSession.findUnique({ where: { id } });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.closedAt) {
    return NextResponse.json({ error: "Session is already closed." }, { status: 409 });
  }

  const { cashSales, cardSales, upiSales, ordersCount, grandTotal, expectedCash } = await computeSessionCashSummary(
    id,
    session.openingAmount,
  );
  const { closingAmount } = parsed.data;

  const updated = await prisma.posSession.update({
    where: { id },
    data: {
      closedAt: new Date(),
      closedById: user!.id,
      closingAmount,
      expectedCash,
    },
  });

  return NextResponse.json({
    session: updated,
    summary: {
      openingAmount: session.openingAmount,
      closingAmount,
      expectedCash,
      variance: closingAmount - expectedCash,
      cashSales,
      cardSales,
      upiSales,
      ordersCount,
      grandTotal,
    },
  });
}
