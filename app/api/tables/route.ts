import { NextRequest, NextResponse } from "next/server";
import { treeifyError, z } from "zod";

import { requireAdmin, requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const tables = await prisma.table.findMany({
    include: { floor: true },
    orderBy: [{ floorId: "asc" }, { number: "asc" }],
  });

  return NextResponse.json(tables);
}

export const tableSchema = z.object({
  number: z.coerce.number().int().positive("Table number must be positive"),
  seats: z.coerce.number().int().positive().default(2),
  active: z.boolean().default(true),
  floorId: z.string().min(1, "Floor is required"),
});

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = tableSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: treeifyError(parsed.error) }, { status: 400 });
  }

  try {
    const table = await prisma.table.create({ data: parsed.data, include: { floor: true } });
    return NextResponse.json(table, { status: 201 });
  } catch {
    return NextResponse.json({ error: "A table with that number already exists on this floor." }, { status: 409 });
  }
}
