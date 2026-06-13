import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const promotions = await prisma.promotion.findMany({
    include: { product: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(promotions);
}

const promotionSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    target: z.enum(["PRODUCT", "ORDER"]),
    productId: z.string().min(1).optional().nullable(),
    minQty: z.number().int().positive().optional().nullable(),
    minOrderAmount: z.number().positive().optional().nullable(),
    discountType: z.enum(["PERCENT", "FIXED"]),
    value: z.number().positive("Value must be greater than 0"),
    active: z.boolean().optional(),
  })
  .refine((data) => data.target !== "PRODUCT" || !!data.productId, {
    message: "Pick a product for product promotions",
    path: ["productId"],
  })
  .refine((data) => data.target !== "ORDER" || data.minOrderAmount != null, {
    message: "Minimum order amount is required for order promotions",
    path: ["minOrderAmount"],
  });

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = promotionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  const promotion = await prisma.promotion.create({
    data: {
      name: data.name,
      target: data.target,
      discountType: data.discountType,
      value: data.value,
      active: data.active ?? true,
      productId: data.target === "PRODUCT" ? data.productId : null,
      minQty: data.target === "PRODUCT" ? (data.minQty ?? null) : null,
      minOrderAmount: data.target === "ORDER" ? (data.minOrderAmount ?? null) : null,
    },
    include: { product: { select: { id: true, name: true } } },
  });

  return NextResponse.json(promotion, { status: 201 });
}
