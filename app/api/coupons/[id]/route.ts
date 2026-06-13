import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const updateSchema = z.object({
  code: z
    .string()
    .min(1)
    .transform((value) => value.trim().toUpperCase())
    .optional(),
  discountType: z.enum(["PERCENT", "FIXED"]).optional(),
  value: z.number().positive().optional(),
  active: z.boolean().optional(),
});

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
    const coupon = await prisma.coupon.update({ where: { id }, data: parsed.data });
    return NextResponse.json(coupon);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }
    throw error;
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  await prisma.order.updateMany({ where: { couponId: id }, data: { couponId: null } });
  await prisma.coupon.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
