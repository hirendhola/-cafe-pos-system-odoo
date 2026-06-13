import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const PAYMENT_TYPES = ["CASH", "CARD", "UPI"] as const;

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const existing = await prisma.paymentMethod.findMany();
  const existingTypes = new Set(existing.map((method) => method.type));
  const missing = PAYMENT_TYPES.filter((type) => !existingTypes.has(type));

  if (missing.length > 0) {
    await prisma.paymentMethod.createMany({
      data: missing.map((type) => ({ type })),
    });
  }

  const methods = missing.length > 0 ? await prisma.paymentMethod.findMany() : existing;
  const order = { CASH: 0, CARD: 1, UPI: 2 } as const;
  methods.sort((a, b) => order[a.type] - order[b.type]);

  return NextResponse.json(methods);
}
