import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { tableSchema } from "@/app/api/tables/route";

const updateSchema = tableSchema.partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const table = await prisma.table.update({ where: { id }, data: parsed.data, include: { floor: true } });
    return NextResponse.json(table);
  } catch {
    return NextResponse.json({ error: "A table with that number already exists on this floor." }, { status: 409 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.table.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Cannot delete a table that has existing orders." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}
