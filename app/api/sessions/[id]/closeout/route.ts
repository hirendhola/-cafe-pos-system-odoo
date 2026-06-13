import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { computeSessionCashSummary } from "@/lib/pos-session";
import { getDiscountsReport, getEmployeeReport, getItemReport, getPaidOrders, summarizeNetSales } from "@/lib/reports";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const session = await prisma.posSession.findUnique({
    where: { id },
    include: {
      openedBy: { select: { name: true } },
      closedBy: { select: { name: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const [cashSummary, orders] = await Promise.all([
    computeSessionCashSummary(id, session.openingAmount),
    getPaidOrders({ sessionId: id }),
  ]);

  const salesSummary = summarizeNetSales(orders);
  const employeeActivity = getEmployeeReport(orders);
  const { items: topItems, categories } = getItemReport(orders);
  const discounts = getDiscountsReport(orders);

  return NextResponse.json({
    session: {
      id: session.id,
      openedAt: session.openedAt,
      closedAt: session.closedAt,
      openedBy: session.openedBy.name,
      closedBy: session.closedBy?.name ?? null,
      closingAmount: session.closingAmount,
      expectedCash: session.expectedCash,
    },
    cashSummary,
    salesSummary,
    employeeActivity,
    topItems,
    categories,
    discounts,
  });
}
