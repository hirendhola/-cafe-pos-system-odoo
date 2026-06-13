import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  archived: true,
  createdAt: true,
} as const;

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  archived: z.boolean().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  if (id === user.id) {
    if (data.role && data.role !== "ADMIN") {
      return NextResponse.json({ error: "You cannot change your own role." }, { status: 400 });
    }

    if (data.archived) {
      return NextResponse.json({ error: "You cannot archive your own account." }, { status: 400 });
    }
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({ where: { id }, data, select: userSelect });

  return NextResponse.json(updated);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  if (id === user.id) {
    return NextResponse.json({ error: "You cannot delete your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Cannot delete a user with POS session history. Archive the account instead." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}
