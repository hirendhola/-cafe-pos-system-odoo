import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const paySchema = z.object({
  paymentType: z.enum(["CASH", "CARD", "UPI"]),
  paymentRef: z.string().trim().min(1).optional(),
  amountTendered: z.number().nonnegative().optional(),
});

type PayUpdateData = {
  status: "PAID";
  paymentType: "CASH" | "CARD" | "UPI";
  paidAt: Date;
  paidById: string;
  paymentRef?: string | null;
  amountTendered?: number;
  changeDue?: number;
  sessionId?: string;
};

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = paySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "DRAFT") {
    return NextResponse.json({ error: "Order is not awaiting payment." }, { status: 409 });
  }

  if (order.items.length === 0) {
    return NextResponse.json({ error: "Order has no items." }, { status: 400 });
  }

  const { paymentType, paymentRef, amountTendered } = parsed.data;

  const method = await prisma.paymentMethod.findUnique({ where: { type: paymentType } });
  if (!method?.enabled) {
    return NextResponse.json({ error: `${paymentType} payments are not enabled.` }, { status: 400 });
  }

  const data: PayUpdateData = {
    status: "PAID",
    paymentType,
    paidAt: new Date(),
    paidById: user!.id,
  };

  if (paymentType === "CASH") {
    if (amountTendered === undefined || amountTendered < order.total) {
      return NextResponse.json({ error: "Amount received must be at least the order total." }, { status: 400 });
    }
    data.amountTendered = amountTendered;
    data.changeDue = amountTendered - order.total;
    data.paymentRef = paymentRef ?? null;
  } else if (paymentType === "CARD") {
    if (!paymentRef) {
      return NextResponse.json({ error: "Transaction reference is required for card payments." }, { status: 400 });
    }
    data.paymentRef = paymentRef;
  } else {
    data.paymentRef = paymentRef ?? null;
  }

  if (!order.sessionId) {
    const openSession = await prisma.posSession.findFirst({
      where: { closedAt: null },
      orderBy: { openedAt: "desc" },
    });
    if (openSession) data.sessionId = openSession.id;
  }

  const updated = await prisma.order.update({
    where: { id },
    data,
    include: {
      items: { include: { product: { include: { category: true } } }, orderBy: { createdAt: "asc" } },
      table: { include: { floor: true } },
      customer: true,
    },
  });

  return NextResponse.json(updated);
}
