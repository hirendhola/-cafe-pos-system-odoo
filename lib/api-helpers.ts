import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getSessionUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { user, response: null };
}

export async function requireAdmin() {
  const user = await getSessionUser();

  if (!user) {
    return { user: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (user.role !== "ADMIN") {
    return { user: null, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { user, response: null };
}
