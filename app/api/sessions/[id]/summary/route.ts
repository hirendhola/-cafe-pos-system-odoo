import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { computeSessionCashSummary } from "@/lib/pos-session";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const session = await prisma.posSession.findUnique({ where: { id } });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const summary = await computeSessionCashSummary(id, session.openingAmount);

  return NextResponse.json(summary);
}
