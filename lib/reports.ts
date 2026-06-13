import { addDays, addMonths, addWeeks, differenceInCalendarDays, format, startOfDay, startOfMonth, startOfWeek } from "date-fns";

import { Prisma } from "@/generated/prisma/client";
import { PaymentType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

export type OrderFilter = {
  from?: Date;
  to?: Date;
  sessionId?: string;
};

export const paidOrderInclude = {
  table: { include: { floor: true } },
  customer: true,
  createdBy: { select: { id: true, name: true } },
  paidBy: { select: { id: true, name: true } },
  coupon: { select: { id: true, code: true, active: true } },
  items: {
    include: {
      product: { include: { category: true } },
    },
  },
} satisfies Prisma.OrderInclude;

export type PaidOrder = Prisma.OrderGetPayload<{ include: typeof paidOrderInclude }>;

export async function getPaidOrders(filter: OrderFilter): Promise<PaidOrder[]> {
  const where: Prisma.OrderWhereInput = { status: "PAID" };

  if (filter.sessionId) where.sessionId = filter.sessionId;

  if (filter.from || filter.to) {
    where.paidAt = {};
    if (filter.from) where.paidAt.gte = filter.from;
    if (filter.to) where.paidAt.lte = filter.to;
  }

  return prisma.order.findMany({ where, include: paidOrderInclude, orderBy: { paidAt: "asc" } });
}

// ---------------------------------------------------------------------------
// Sales trend
// ---------------------------------------------------------------------------

export type BucketGranularity = "day" | "week" | "month";

export function bucketGranularity(from: Date, to: Date): BucketGranularity {
  const days = differenceInCalendarDays(to, from);
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

export type SalesTrendPoint = {
  bucket: string;
  label: string;
  grossSales: number;
  discount: number;
  netSales: number;
  tax: number;
  total: number;
  orders: number;
};

function bucketStart(date: Date, granularity: BucketGranularity): Date {
  switch (granularity) {
    case "day":
      return startOfDay(date);
    case "week":
      return startOfWeek(date, { weekStartsOn: 1 });
    case "month":
      return startOfMonth(date);
  }
}

function advanceBucket(date: Date, granularity: BucketGranularity): Date {
  switch (granularity) {
    case "day":
      return addDays(date, 1);
    case "week":
      return addWeeks(date, 1);
    case "month":
      return addMonths(date, 1);
  }
}

export function buildSalesTrend(
  orders: PaidOrder[],
  from: Date,
  to: Date,
  granularity: BucketGranularity = bucketGranularity(from, to),
): SalesTrendPoint[] {
  const labelFormat = granularity === "month" ? "MMM yyyy" : "dd MMM";

  const buckets = new Map<string, SalesTrendPoint>();

  let cursor = bucketStart(from, granularity);
  const end = bucketStart(to, granularity);
  while (cursor <= end) {
    const key = cursor.toISOString();
    buckets.set(key, {
      bucket: key,
      label: format(cursor, labelFormat),
      grossSales: 0,
      discount: 0,
      netSales: 0,
      tax: 0,
      total: 0,
      orders: 0,
    });
    cursor = advanceBucket(cursor, granularity);
  }

  for (const order of orders) {
    if (!order.paidAt) continue;

    const key = bucketStart(order.paidAt, granularity).toISOString();
    const point = buckets.get(key);
    if (!point) continue;

    const gross = order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);

    point.grossSales += gross;
    point.discount += order.discount;
    point.netSales += order.subtotal - order.discount;
    point.tax += order.tax;
    point.total += order.total;
    point.orders += 1;
  }

  return Array.from(buckets.values());
}

// ---------------------------------------------------------------------------
// Net sales summary
// ---------------------------------------------------------------------------

export type NetSalesSummary = {
  grossSales: number;
  itemDiscount: number;
  orderDiscount: number;
  totalDiscount: number;
  netSales: number;
  tax: number;
  totalRevenue: number;
  ordersCount: number;
  aov: number;
  byPaymentType: Record<PaymentType, number>;
};

export function summarizeNetSales(orders: PaidOrder[]): NetSalesSummary {
  let grossSales = 0;
  let itemDiscount = 0;
  let orderDiscount = 0;
  let netSales = 0;
  let tax = 0;
  let totalRevenue = 0;
  const byPaymentType: Record<PaymentType, number> = { CASH: 0, CARD: 0, UPI: 0 };

  for (const order of orders) {
    const gross = order.items.reduce((sum, item) => sum + item.unitPrice * item.qty, 0);
    const lineDiscountTotal = order.items.reduce((sum, item) => sum + item.lineDiscount, 0);

    grossSales += gross;
    itemDiscount += lineDiscountTotal;
    orderDiscount += order.discount;
    netSales += order.subtotal - order.discount;
    tax += order.tax;
    totalRevenue += order.total;

    if (order.paymentType) byPaymentType[order.paymentType] += order.total;
  }

  const ordersCount = orders.length;
  const totalDiscount = itemDiscount + orderDiscount;
  const aov = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  return { grossSales, itemDiscount, orderDiscount, totalDiscount, netSales, tax, totalRevenue, ordersCount, aov, byPaymentType };
}

// ---------------------------------------------------------------------------
// Employee report
// ---------------------------------------------------------------------------

export type EmployeeReportRow = {
  id: string;
  name: string;
  ordersPaid: number;
  revenue: number;
  aov: number;
  ordersCreated: number;
};

export function getEmployeeReport(orders: PaidOrder[]): EmployeeReportRow[] {
  const rows = new Map<string, EmployeeReportRow>();

  const ensure = (id: string, name: string) => {
    let row = rows.get(id);
    if (!row) {
      row = { id, name, ordersPaid: 0, revenue: 0, aov: 0, ordersCreated: 0 };
      rows.set(id, row);
    }
    return row;
  };

  for (const order of orders) {
    if (order.paidBy) {
      const row = ensure(order.paidBy.id, order.paidBy.name);
      row.ordersPaid += 1;
      row.revenue += order.total;
    }
    if (order.createdBy) {
      const row = ensure(order.createdBy.id, order.createdBy.name);
      row.ordersCreated += 1;
    }
  }

  for (const row of rows.values()) {
    row.aov = row.ordersPaid > 0 ? row.revenue / row.ordersPaid : 0;
  }

  return Array.from(rows.values()).sort((a, b) => b.revenue - a.revenue);
}

// ---------------------------------------------------------------------------
// Item-wise report
// ---------------------------------------------------------------------------

export type ItemReportRow = {
  productId: string;
  name: string;
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  qty: number;
  grossRevenue: number;
  discount: number;
  netRevenue: number;
};

export type CategoryReportRow = {
  categoryId: string;
  name: string;
  color: string;
  qty: number;
  netRevenue: number;
};

export function getItemReport(
  orders: PaidOrder[],
  categoryId?: string,
): { items: ItemReportRow[]; categories: CategoryReportRow[] } {
  const itemRows = new Map<string, ItemReportRow>();
  const categoryRows = new Map<string, CategoryReportRow>();

  for (const order of orders) {
    for (const item of order.items) {
      const { product } = item;
      const { category } = product;

      if (categoryId && category.id !== categoryId) continue;

      const gross = item.unitPrice * item.qty;
      const net = gross - item.lineDiscount;

      let itemRow = itemRows.get(product.id);
      if (!itemRow) {
        itemRow = {
          productId: product.id,
          name: product.name,
          categoryId: category.id,
          categoryName: category.name,
          categoryColor: category.color,
          qty: 0,
          grossRevenue: 0,
          discount: 0,
          netRevenue: 0,
        };
        itemRows.set(product.id, itemRow);
      }
      itemRow.qty += item.qty;
      itemRow.grossRevenue += gross;
      itemRow.discount += item.lineDiscount;
      itemRow.netRevenue += net;

      let categoryRow = categoryRows.get(category.id);
      if (!categoryRow) {
        categoryRow = { categoryId: category.id, name: category.name, color: category.color, qty: 0, netRevenue: 0 };
        categoryRows.set(category.id, categoryRow);
      }
      categoryRow.qty += item.qty;
      categoryRow.netRevenue += net;
    }
  }

  return {
    items: Array.from(itemRows.values()).sort((a, b) => b.netRevenue - a.netRevenue),
    categories: Array.from(categoryRows.values()).sort((a, b) => b.netRevenue - a.netRevenue),
  };
}

// ---------------------------------------------------------------------------
// Discounts & promotions report
// ---------------------------------------------------------------------------

export type CouponUsageRow = {
  couponId: string;
  code: string;
  active: boolean;
  timesUsed: number;
  totalDiscount: number;
};

export type ProductPromoRow = {
  productId: string;
  name: string;
  timesApplied: number;
  totalDiscount: number;
};

export type DiscountsReport = {
  automatedOrderPromos: { count: number; totalDiscount: number };
  coupons: CouponUsageRow[];
  productPromos: ProductPromoRow[];
};

export function getDiscountsReport(orders: PaidOrder[]): DiscountsReport {
  let automatedCount = 0;
  let automatedTotal = 0;
  const couponRows = new Map<string, CouponUsageRow>();
  const productPromoRows = new Map<string, ProductPromoRow>();

  for (const order of orders) {
    if (order.coupon) {
      let row = couponRows.get(order.coupon.id);
      if (!row) {
        row = { couponId: order.coupon.id, code: order.coupon.code, active: order.coupon.active, timesUsed: 0, totalDiscount: 0 };
        couponRows.set(order.coupon.id, row);
      }
      row.timesUsed += 1;
      // order.discount may also include an order-level promotion discount on the
      // same order; that portion can't be split out retroactively, so it's
      // attributed to the coupon here.
      row.totalDiscount += order.discount;
    } else if (order.discount > 0) {
      automatedCount += 1;
      automatedTotal += order.discount;
    }

    for (const item of order.items) {
      if (item.lineDiscount <= 0) continue;

      let row = productPromoRows.get(item.product.id);
      if (!row) {
        row = { productId: item.product.id, name: item.product.name, timesApplied: 0, totalDiscount: 0 };
        productPromoRows.set(item.product.id, row);
      }
      row.timesApplied += 1;
      row.totalDiscount += item.lineDiscount;
    }
  }

  return {
    automatedOrderPromos: { count: automatedCount, totalDiscount: automatedTotal },
    coupons: Array.from(couponRows.values()).sort((a, b) => b.totalDiscount - a.totalDiscount),
    productPromos: Array.from(productPromoRows.values()).sort((a, b) => b.totalDiscount - a.totalDiscount),
  };
}
