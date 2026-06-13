import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return NextResponse.json(coupons);
}

const couponSchema = z.object({
  code: z
    .string()
    .min(1, "Code is required")
    .transform((value) => value.trim().toUpperCase()),
  discountType: z.enum(["PERCENT", "FIXED"]),
  value: z.number().positive("Value must be greater than 0"),
  active: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = couponSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const coupon = await prisma.coupon.create({ data: parsed.data });
    return NextResponse.json(coupon, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A coupon with this code already exists." }, { status: 409 });
    }
    throw error;
  }
}
