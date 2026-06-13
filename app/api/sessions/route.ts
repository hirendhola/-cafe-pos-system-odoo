import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

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
      include: { openedBy: { select: { name: true } } },
    });

    return NextResponse.json(sessions);
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
