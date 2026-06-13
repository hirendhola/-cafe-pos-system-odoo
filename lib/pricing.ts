import { Prisma } from "@/generated/prisma/client";
import { DiscountType, PromotionTarget } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

type PricedItem = {
  id: string;
  unitPrice: number;
  qty: number;
  product: { id: string; tax: number };
};

type ActivePromotion = {
  name: string;
  target: PromotionTarget;
  productId: string | null;
  minQty: number | null;
  minOrderAmount: number | null;
  discountType: DiscountType;
  value: number;
};

type ActiveCoupon = {
  code: string;
  discountType: DiscountType;
  value: number;
} | null;

export type DiscountSource = { label: string; amount: number };

export function computeOrderTotals(items: PricedItem[], promotions: ActivePromotion[], coupon: ActiveCoupon) {
  const lineDiscounts = new Map<string, number>();
  const lineDiscountLabels = new Map<string, string>();

  let subtotal = 0;
  let tax = 0;

  for (const item of items) {
    const lineAmount = item.unitPrice * item.qty;

    let lineDiscount = 0;
    let lineDiscountLabel: string | undefined;
    for (const promo of promotions) {
      if (promo.target !== PromotionTarget.PRODUCT || promo.productId !== item.product.id) continue;
      if (item.qty < (promo.minQty ?? 1)) continue;

      const discount = promo.discountType === DiscountType.PERCENT ? lineAmount * (promo.value / 100) : promo.value;
      const capped = Math.min(discount, lineAmount);
      if (capped > lineDiscount) {
        lineDiscount = capped;
        lineDiscountLabel = promo.name;
      }
    }

    lineDiscounts.set(item.id, lineDiscount);
    if (lineDiscountLabel) lineDiscountLabels.set(item.id, lineDiscountLabel);

    const lineNet = lineAmount - lineDiscount;
    subtotal += lineNet;
    tax += lineNet * (item.product.tax / 100);
  }

  let promoDiscount = 0;
  let promoDiscountLabel: string | undefined;
  for (const promo of promotions) {
    if (promo.target !== PromotionTarget.ORDER) continue;
    if (subtotal < (promo.minOrderAmount ?? 0)) continue;

    const discount = promo.discountType === DiscountType.PERCENT ? subtotal * (promo.value / 100) : promo.value;
    const capped = Math.min(discount, subtotal);
    if (capped > promoDiscount) {
      promoDiscount = capped;
      promoDiscountLabel = promo.name;
    }
  }

  let couponDiscount = 0;
  if (coupon) {
    const remaining = subtotal - promoDiscount;
    const discount = coupon.discountType === DiscountType.PERCENT ? remaining * (coupon.value / 100) : coupon.value;
    couponDiscount = Math.max(0, Math.min(discount, remaining));
  }

  const discount = promoDiscount + couponDiscount;
  const total = subtotal - discount + tax;

  const discountBreakdown: DiscountSource[] = [];
  if (promoDiscount > 0 && promoDiscountLabel) {
    discountBreakdown.push({ label: promoDiscountLabel, amount: promoDiscount });
  }
  if (couponDiscount > 0 && coupon) {
    discountBreakdown.push({ label: `Coupon ${coupon.code}`, amount: couponDiscount });
  }

  return { subtotal, tax, total, discount, lineDiscounts, lineDiscountLabels, discountBreakdown };
}

const orderTotalsInclude = {
  items: { include: { product: { include: { category: true } } }, orderBy: { createdAt: "asc" as const } },
  table: { include: { floor: true } },
  customer: true,
};

export async function recomputeOrderTotals(orderId: string, tx: Prisma.TransactionClient = prisma) {
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  const items = await tx.orderItem.findMany({ where: { orderId }, include: { product: true } });
  const promotions = await tx.promotion.findMany({ where: { active: true } });
  const coupon = order.couponId ? await tx.coupon.findUnique({ where: { id: order.couponId } }) : null;

  const { subtotal, tax, total, discount, lineDiscounts } = computeOrderTotals(
    items,
    promotions,
    coupon?.active ? coupon : null,
  );

  await Promise.all(
    items.map((item) =>
      tx.orderItem.update({ where: { id: item.id }, data: { lineDiscount: lineDiscounts.get(item.id) ?? 0 } }),
    ),
  );

  return tx.order.update({
    where: { id: orderId },
    data: { subtotal, tax, total, discount },
    include: orderTotalsInclude,
  });
}
