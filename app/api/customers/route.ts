import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const q = request.nextUrl.searchParams.get("q")?.trim();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { name: "asc" },
    take: q ? 10 : undefined,
  });

  return NextResponse.json(customers);
}

const emailField = z
  .union([z.string().trim().toLowerCase().email("Enter a valid email"), z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

const phoneField = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : null));

export const customerSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: emailField,
  phone: phoneField,
});

export async function POST(request: NextRequest) {
  const { response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = customerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.create({ data: parsed.data });

  return NextResponse.json(customer, { status: 201 });
}
