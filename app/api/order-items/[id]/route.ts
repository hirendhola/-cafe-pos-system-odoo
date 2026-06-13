import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  kdsStatus: z.enum(["TO_COOK", "PREPARING", "COMPLETED"]),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const item = await prisma.orderItem.update({
    where: { id },
    data: {
      kdsStatus: parsed.data.kdsStatus,
      kdsItemDone: parsed.data.kdsStatus === "COMPLETED",
    },
  });

  return NextResponse.json(item);
}
