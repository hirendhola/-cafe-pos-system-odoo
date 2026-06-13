import { NextRequest, NextResponse } from "next/server";

import { requireUser } from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { renderReceiptPdf } from "@/lib/receipt-pdf";
import { RECEIPT_FROM_EMAIL, resend } from "@/lib/resend";

const currency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" });

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { response } = await requireUser();
  if (response) return response;

  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true }, orderBy: { createdAt: "asc" } },
      customer: true,
      table: { include: { floor: true } },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PAID") {
    return NextResponse.json({ error: "Receipts can only be emailed for paid orders." }, { status: 400 });
  }

  if (!order.customer?.email) {
    return NextResponse.json({ error: "This order has no customer email on file." }, { status: 400 });
  }

  const itemsHtml = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:4px 0;">${item.qty} x ${item.product.name}</td>
          <td style="padding:4px 0; text-align:right;">${currency.format(item.unitPrice * item.qty - item.lineDiscount)}</td>
        </tr>`,
    )
    .join("");

  const html = `
    <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
      <h2 style="margin-bottom:0;">Cafe POS</h2>
      <p style="color:#666; margin-top:4px;">Receipt for Order ${order.number}</p>
      <p style="color:#666;">${new Date(order.paidAt ?? order.createdAt).toLocaleString("en-IN")}${
        order.table ? ` &middot; Table ${order.table.number} (${order.table.floor.name})` : ""
      }</p>
      <table style="width:100%; border-collapse:collapse; margin-top:16px;">
        ${itemsHtml}
      </table>
      <table style="width:100%; border-collapse:collapse; margin-top:12px; border-top:1px solid #ddd; padding-top:8px;">
        <tr><td style="padding:2px 0;">Subtotal</td><td style="text-align:right;">${currency.format(order.subtotal)}</td></tr>
        ${order.discount > 0 ? `<tr><td style="padding:2px 0;">Discount</td><td style="text-align:right;">-${currency.format(order.discount)}</td></tr>` : ""}
        <tr><td style="padding:2px 0;">Tax</td><td style="text-align:right;">${currency.format(order.tax)}</td></tr>
        <tr><td style="padding:6px 0; font-weight:bold;">Total</td><td style="text-align:right; font-weight:bold;">${currency.format(order.total)}</td></tr>
      </table>
      <p style="color:#666; margin-top:16px;">
        Paid via ${order.paymentType ?? "—"}${order.changeDue ? ` &middot; Change given: ${currency.format(order.changeDue)}` : ""}
      </p>
      <p style="color:#999; font-size:12px; margin-top:24px;">Thank you for visiting!</p>
    </div>
  `;

  const pdf = await renderReceiptPdf(order);

  const { data, error } = await resend.emails.send({
    from: RECEIPT_FROM_EMAIL,
    to: [order.customer.email],
    subject: `Receipt — Order ${order.number}`,
    html,
    attachments: [
      {
        filename: `receipt-${order.number}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }

  return NextResponse.json({ id: data?.id });
}
