import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { productSchema } from "@/app/api/products/route";

const updateSchema = productSchema.partial();

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({
    where: { id },
    data: parsed.data,
    include: { category: true },
  });

  return NextResponse.json(product);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireAdmin();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.product.delete({ where: { id } });
  } catch {
    return NextResponse.json(
      { error: "Cannot delete a product that is used on existing orders. Mark it inactive instead." },
      { status: 409 },
    );
  }

  return NextResponse.json({ success: true });
}
