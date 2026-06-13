import { NextRequest, NextResponse } from "next/server";

import { customerSchema } from "@/app/api/customers/route";
import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

const updateSchema = customerSchema.partial();

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      orders: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          number: true,
          status: true,
          total: true,
          createdAt: true,
          table: { select: { number: true, floor: { select: { name: true } } } },
        },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json(customer);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;
  const body = await request.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data });

  return NextResponse.json(customer);
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  try {
    await prisma.customer.delete({ where: { id } });
  } catch {
    return NextResponse.json({ error: "Failed to delete customer." }, { status: 409 });
  }

  return NextResponse.json({ success: true });
}
