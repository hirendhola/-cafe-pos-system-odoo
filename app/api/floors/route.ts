import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const floors = await prisma.floor.findMany({
    include: { tables: { orderBy: { number: "asc" } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(floors);
}

const floorSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = floorSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const floor = await prisma.floor.create({ data: parsed.data });

  return NextResponse.json(floor, { status: 201 });
}
