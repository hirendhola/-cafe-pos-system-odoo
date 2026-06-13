import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

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

  const paidOrders = await prisma.order.findMany({
    where: { sessionId: id, status: "PAID" },
    select: { total: true, paymentType: true },
  });

  const sumBy = (type: "CASH" | "CARD" | "UPI") =>
    paidOrders.filter((order) => order.paymentType === type).reduce((sum, order) => sum + order.total, 0);

  const cashSales = sumBy("CASH");
  const cardSales = sumBy("CARD");
  const upiSales = sumBy("UPI");
  const grandTotal = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const expectedCash = session.openingAmount + cashSales;
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
      ordersCount: paidOrders.length,
      grandTotal,
    },
  });
}
