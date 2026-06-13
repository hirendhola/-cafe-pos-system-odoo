import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin, requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const products = await prisma.product.findMany({
    include: { category: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(products);
}

export const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().nonnegative("Price must be 0 or more"),
  unit: z.string().min(1).default("pcs"),
  tax: z.coerce.number().min(0).max(100).default(0),
  description: z.string().trim().optional().nullable(),
  imageUrl: z.string().trim().optional().nullable(),
  showOnKds: z.boolean().default(true),
  active: z.boolean().default(true),
  categoryId: z.string().min(1, "Category is required"),
});

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = productSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({
    data: parsed.data,
    include: { category: true },
  });

  return NextResponse.json(product, { status: 201 });
}
