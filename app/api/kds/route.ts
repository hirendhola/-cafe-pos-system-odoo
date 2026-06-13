import { NextResponse } from "next/server";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET() {
  const { response } = await requireUser();
  if (response) return response;

  const orders = await prisma.order.findMany({
    where: {
      status: "DRAFT",
      items: { some: { product: { showOnKds: true }, kdsStatus: { not: "COMPLETED" } } },
    },
    include: {
      items: {
        where: { product: { showOnKds: true } },
        include: { product: { include: { category: true } } },
        orderBy: { createdAt: "asc" },
      },
      table: { include: { floor: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(orders);
}
