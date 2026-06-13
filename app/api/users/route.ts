import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireAdmin } from "@/lib/api-helpers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  archived: true,
  createdAt: true,
} as const;

export async function GET() {
  const { response } = await requireAdmin();
  if (response) return response;

  const users = await prisma.user.findMany({
    select: userSelect,
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(users);
}

const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, password, role } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json({ error: "A user with this email already exists." }, { status: 409 });
  }

  const context = await auth.$context;
  const hash = await context.password.hash(password);

  const createdUser = await context.internalAdapter.createUser({
    email: normalizedEmail,
    name,
    role,
    emailVerified: true,
  });

  await context.internalAdapter.linkAccount({
    userId: createdUser.id,
    providerId: "credential",
    accountId: createdUser.id,
    password: hash,
  });

  const user = await prisma.user.findUniqueOrThrow({ where: { id: createdUser.id }, select: userSelect });

  return NextResponse.json(user, { status: 201 });
}
