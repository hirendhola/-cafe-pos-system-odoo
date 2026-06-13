import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { Prisma } from "@/generated/prisma/client";
import { requireAdmin, requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();
  const categoryId = searchParams.get("categoryId");
  const active = searchParams.get("active");
  const sort = searchParams.get("sort");
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 20));

  const where: Prisma.ProductWhereInput = {};

  if (q) where.name = { contains: q, mode: "insensitive" };
  if (categoryId && categoryId !== "all") where.categoryId = categoryId;
  if (active === "true") where.active = true;
  else if (active === "false") where.active = false;

  let orderBy: Prisma.ProductOrderByWithRelationInput = { name: "asc" };
  switch (sort) {
    case "name_desc":
      orderBy = { name: "desc" };
      break;
    case "price_asc":
      orderBy = { price: "asc" };
      break;
    case "price_desc":
      orderBy = { price: "desc" };
      break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({ products, total });
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
