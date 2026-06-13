import { randomUUID } from "crypto";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

import { requireAdmin } from "@/lib/api-helpers";
import { deleteFromR2, r2KeyFromUrl, uploadToR2 } from "@/lib/r2";

const MAX_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"]);

export async function POST(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");
  const previousUrl = formData.get("previousUrl");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  if (!ACCEPTED_TYPES.has(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, WEBP, GIF, or AVIF image." }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Image must be smaller than 5MB." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const key = `products/${Date.now()}-${randomUUID()}.webp`;
  const url = await uploadToR2(key, optimized, "image/webp");

  if (typeof previousUrl === "string") {
    const previousKey = r2KeyFromUrl(previousUrl);
    if (previousKey) {
      await deleteFromR2(previousKey).catch(() => {});
    }
  }

  return NextResponse.json({ url });
}

export async function DELETE(request: NextRequest) {
  const { response } = await requireAdmin();
  if (response) return response;

  const body = await request.json().catch(() => null);
  const url = body && typeof body === "object" ? (body as { url?: unknown }).url : null;
  const key = typeof url === "string" ? r2KeyFromUrl(url) : null;

  if (key) {
    await deleteFromR2(key).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
