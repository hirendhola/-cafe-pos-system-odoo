import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { paidOrderInclude, summarizeNetSales, type PaidOrder } from "@/lib/reports";

const openSchema = z.object({
  openingAmount: z.number().nonnegative(),
});

export async function GET(request: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);

  if (searchParams.get("all") === "true") {
    if (user!.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sessions = await prisma.posSession.findMany({
      orderBy: { openedAt: "desc" },
      take: 50,
      include: {
        openedBy: { select: { name: true } },
        closedBy: { select: { name: true } },
      },
    });

    const sessionIds = sessions.map((session) => session.id);
    const orders = sessionIds.length
      ? await prisma.order.findMany({
          where: { sessionId: { in: sessionIds }, status: "PAID" },
          include: paidOrderInclude,
          orderBy: { paidAt: "asc" },
        })
      : [];

    const ordersBySession = new Map<string, PaidOrder[]>();
    for (const order of orders) {
      if (!order.sessionId) continue;
      const list = ordersBySession.get(order.sessionId);
      if (list) list.push(order);
      else ordersBySession.set(order.sessionId, [order]);
    }

    const rows = sessions.map((session) => {
      const sales = summarizeNetSales(ordersBySession.get(session.id) ?? []);
      const expectedCash = session.openingAmount + sales.byPaymentType.CASH;
      const variance =
        session.closedAt && session.closingAmount !== null ? session.closingAmount - expectedCash : null;

      return {
        id: session.id,
        openedAt: session.openedAt,
        closedAt: session.closedAt,
        openedBy: session.openedBy.name,
        closedBy: session.closedBy?.name ?? null,
        openingAmount: session.openingAmount,
        closingAmount: session.closingAmount,
        expectedCash,
        variance,
        cashSales: sales.byPaymentType.CASH,
        cardSales: sales.byPaymentType.CARD,
        upiSales: sales.byPaymentType.UPI,
        ordersCount: sales.ordersCount,
        netSales: sales.netSales,
        totalRevenue: sales.totalRevenue,
      };
    });

    return NextResponse.json(rows);
  }

  const [current, lastClosed] = await Promise.all([
    prisma.posSession.findFirst({ where: { closedAt: null }, orderBy: { openedAt: "desc" } }),
    prisma.posSession.findFirst({ where: { closedAt: { not: null } }, orderBy: { closedAt: "desc" } }),
  ]);

  return NextResponse.json({ current, lastClosed });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = openSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.posSession.findFirst({ where: { closedAt: null } });
  if (existing) {
    return NextResponse.json({ error: "A session is already open." }, { status: 409 });
  }

  const session = await prisma.posSession.create({
    data: { openingAmount: parsed.data.openingAmount, openedById: user!.id },
  });

  return NextResponse.json(session, { status: 201 });
}
