import "dotenv/config";
import { randomUUID } from "node:crypto";

import { hashPassword } from "@better-auth/utils/password";
import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "../generated/prisma/client";
import { DiscountType, PromotionTarget, Role } from "../generated/prisma/enums";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ---------------------------------------------------------------------------
// RNG helpers
// ---------------------------------------------------------------------------

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem<T>(items: readonly T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickUnique<T>(items: readonly T[], count: number): T[] {
  return shuffle(items).slice(0, Math.min(count, items.length));
}

function weighted<T>(...options: [T, number][]): T {
  const total = options.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [value, weight] of options) {
    if (roll < weight) return value;
    roll -= weight;
  }
  return options[options.length - 1][0];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

// ---------------------------------------------------------------------------
// Demo users (admin + employees) — created via better-auth's own password
// hashing so they can log in immediately with the printed credentials.
// ---------------------------------------------------------------------------

const DEMO_PASSWORD = "Demo@1234";

const DEMO_USERS: { name: string; email: string; role: Role }[] = [
  { name: "Admin User", email: "admin@cafepos.com", role: Role.ADMIN },
  { name: "Priya Sharma", email: "priya@cafepos.com", role: Role.EMPLOYEE },
  { name: "Rahul Verma", email: "rahul@cafepos.com", role: Role.EMPLOYEE },
  { name: "Sara Khan", email: "sara@cafepos.com", role: Role.EMPLOYEE },
  { name: "Vikram Singh", email: "vikram@cafepos.com", role: Role.EMPLOYEE },
];

async function seedUsers() {
  const hashed = await hashPassword(DEMO_PASSWORD);
  const users = [];

  for (const demo of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {},
      create: { name: demo.name, email: demo.email, emailVerified: true, role: demo.role },
    });

    const existingAccount = await prisma.account.findFirst({
      where: { userId: user.id, providerId: "credential" },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: { accountId: user.id, providerId: "credential", userId: user.id, password: hashed },
      });
    }

    users.push(user);
  }

  return users;
}

// ---------------------------------------------------------------------------
// Catalog: categories & products
// ---------------------------------------------------------------------------

const CATEGORIES = [
  { name: "Beverages", color: "#0ea5e9" },
  { name: "Breakfast", color: "#f59e0b" },
  { name: "Starters", color: "#f97316" },
  { name: "Main Course", color: "#16a34a" },
  { name: "Chinese", color: "#dc2626" },
  { name: "Pizza & Pasta", color: "#eab308" },
  { name: "Burgers & Sandwiches", color: "#8b5cf6" },
  { name: "Desserts", color: "#ec4899" },
];

type ProductDef = {
  name: string;
  price: number;
  unit: string;
  category: string;
  tax?: number;
  showOnKds?: boolean;
  active?: boolean;
};

const PRODUCTS: ProductDef[] = [
  // Beverages
  { name: "Masala Chai", price: 60, unit: "cup", category: "Beverages" },
  { name: "Filter Coffee", price: 70, unit: "cup", category: "Beverages" },
  { name: "Cappuccino", price: 150, unit: "cup", category: "Beverages" },
  { name: "Cafe Latte", price: 160, unit: "cup", category: "Beverages" },
  { name: "Cold Coffee", price: 180, unit: "glass", category: "Beverages" },
  { name: "Fresh Lime Soda", price: 90, unit: "glass", category: "Beverages" },
  { name: "Mango Lassi", price: 120, unit: "glass", category: "Beverages" },
  { name: "Iced Tea", price: 110, unit: "glass", category: "Beverages" },
  { name: "Hot Chocolate", price: 140, unit: "cup", category: "Beverages" },
  { name: "Mineral Water", price: 40, unit: "bottle", category: "Beverages", showOnKds: false },

  // Breakfast
  { name: "Masala Dosa", price: 130, unit: "plate", category: "Breakfast" },
  { name: "Idli Sambar", price: 100, unit: "plate", category: "Breakfast" },
  { name: "Poha", price: 80, unit: "plate", category: "Breakfast" },
  { name: "Aloo Paratha", price: 110, unit: "plate", category: "Breakfast" },
  { name: "Bread Omelette", price: 90, unit: "plate", category: "Breakfast" },
  { name: "Upma", price: 90, unit: "plate", category: "Breakfast" },

  // Starters
  { name: "Veg Spring Rolls", price: 180, unit: "plate", category: "Starters" },
  { name: "Paneer Tikka", price: 240, unit: "plate", category: "Starters" },
  { name: "French Fries", price: 140, unit: "plate", category: "Starters" },
  { name: "Chilli Potato", price: 160, unit: "plate", category: "Starters" },
  { name: "Veg Manchurian", price: 190, unit: "plate", category: "Starters" },
  { name: "Hara Bhara Kebab", price: 200, unit: "plate", category: "Starters" },
  { name: "Onion Rings", price: 130, unit: "plate", category: "Starters" },
  { name: "Peri Peri Fries", price: 150, unit: "plate", category: "Starters" },

  // Main Course
  { name: "Butter Naan with Dal Makhani", price: 260, unit: "plate", category: "Main Course" },
  { name: "Paneer Butter Masala", price: 280, unit: "plate", category: "Main Course" },
  { name: "Veg Biryani", price: 220, unit: "plate", category: "Main Course" },
  { name: "Rajma Chawal", price: 190, unit: "plate", category: "Main Course" },
  { name: "Chole Bhature", price: 170, unit: "plate", category: "Main Course" },
  { name: "Veg Thali", price: 250, unit: "plate", category: "Main Course" },
  { name: "Palak Paneer", price: 240, unit: "plate", category: "Main Course" },
  { name: "Mixed Veg Curry", price: 200, unit: "plate", category: "Main Course" },
  { name: "Jeera Rice", price: 130, unit: "plate", category: "Main Course" },
  { name: "Tandoori Roti", price: 30, unit: "pcs", category: "Main Course" },

  // Chinese
  { name: "Veg Hakka Noodles", price: 180, unit: "plate", category: "Chinese" },
  { name: "Veg Fried Rice", price: 170, unit: "plate", category: "Chinese" },
  { name: "Schezwan Noodles", price: 190, unit: "plate", category: "Chinese" },
  { name: "Manchurian Rice", price: 200, unit: "plate", category: "Chinese" },
  { name: "Veg Momos", price: 150, unit: "plate", category: "Chinese" },
  { name: "Honey Chilli Potato", price: 170, unit: "plate", category: "Chinese" },

  // Pizza & Pasta
  { name: "Margherita Pizza", price: 320, unit: "pcs", category: "Pizza & Pasta" },
  { name: "Farmhouse Pizza", price: 380, unit: "pcs", category: "Pizza & Pasta" },
  { name: "Paneer Tikka Pizza", price: 400, unit: "pcs", category: "Pizza & Pasta" },
  { name: "Pasta Alfredo", price: 280, unit: "plate", category: "Pizza & Pasta" },
  { name: "Pasta Arrabiata", price: 260, unit: "plate", category: "Pizza & Pasta" },
  { name: "Mac and Cheese", price: 270, unit: "plate", category: "Pizza & Pasta" },

  // Burgers & Sandwiches
  { name: "Veg Burger", price: 160, unit: "pcs", category: "Burgers & Sandwiches" },
  { name: "Paneer Burger", price: 190, unit: "pcs", category: "Burgers & Sandwiches" },
  { name: "Grilled Sandwich", price: 150, unit: "pcs", category: "Burgers & Sandwiches" },
  { name: "Club Sandwich", price: 180, unit: "pcs", category: "Burgers & Sandwiches" },
  { name: "Cheese Burst Burger", price: 210, unit: "pcs", category: "Burgers & Sandwiches" },
  { name: "Veg Wrap", price: 170, unit: "pcs", category: "Burgers & Sandwiches" },

  // Desserts
  { name: "Chocolate Brownie", price: 150, unit: "pcs", category: "Desserts" },
  { name: "Gulab Jamun", price: 90, unit: "plate", category: "Desserts" },
  { name: "Ice Cream Sundae", price: 160, unit: "bowl", category: "Desserts", showOnKds: false },
  { name: "Rasmalai", price: 110, unit: "plate", category: "Desserts", showOnKds: false },
  { name: "Choco Lava Cake", price: 170, unit: "pcs", category: "Desserts" },
  { name: "Fruit Custard", price: 120, unit: "bowl", category: "Desserts", showOnKds: false },
  { name: "Tiramisu", price: 200, unit: "pcs", category: "Desserts", showOnKds: false },
  { name: "Cheesecake", price: 190, unit: "pcs", category: "Desserts", showOnKds: false, active: false },
];

// ---------------------------------------------------------------------------
// Floors & tables
// ---------------------------------------------------------------------------

const FLOORS: { name: string; tables: { number: number; seats: number }[] }[] = [
  {
    name: "Ground Floor",
    tables: [
      { number: 1, seats: 2 },
      { number: 2, seats: 2 },
      { number: 3, seats: 4 },
      { number: 4, seats: 4 },
      { number: 5, seats: 4 },
      { number: 6, seats: 4 },
      { number: 7, seats: 6 },
      { number: 8, seats: 6 },
    ],
  },
  {
    name: "First Floor",
    tables: [
      { number: 1, seats: 2 },
      { number: 2, seats: 2 },
      { number: 3, seats: 4 },
      { number: 4, seats: 4 },
      { number: 5, seats: 4 },
      { number: 6, seats: 6 },
    ],
  },
  {
    name: "Terrace",
    tables: [
      { number: 1, seats: 2 },
      { number: 2, seats: 4 },
      { number: 3, seats: 4 },
      { number: 4, seats: 6 },
    ],
  },
];

// ---------------------------------------------------------------------------
// Payment methods, coupons & promotions
// ---------------------------------------------------------------------------

const PAYMENT_METHODS: { type: "CASH" | "CARD" | "UPI"; enabled: boolean; upiId?: string }[] = [
  { type: "CASH", enabled: true },
  { type: "CARD", enabled: true },
  { type: "UPI", enabled: true, upiId: "cafepos@upi" },
];

const COUPONS: { code: string; discountType: DiscountType; value: number; active: boolean }[] = [
  { code: "WELCOME10", discountType: DiscountType.PERCENT, value: 10, active: true },
  { code: "FLAT50", discountType: DiscountType.FIXED, value: 50, active: true },
  { code: "FESTIVE20", discountType: DiscountType.PERCENT, value: 20, active: true },
  { code: "LOYALTY100", discountType: DiscountType.FIXED, value: 100, active: false },
  { code: "SUMMER15", discountType: DiscountType.PERCENT, value: 15, active: true },
];

type PromotionDef = {
  name: string;
  target: PromotionTarget;
  productName?: string;
  minQty?: number;
  minOrderAmount?: number;
  discountType: DiscountType;
  value: number;
  active: boolean;
};

const PROMOTIONS: PromotionDef[] = [
  {
    name: "Happy Hour Coffee",
    target: PromotionTarget.PRODUCT,
    productName: "Cappuccino",
    minQty: 2,
    discountType: DiscountType.PERCENT,
    value: 10,
    active: true,
  },
  {
    name: "Combo Fries Deal",
    target: PromotionTarget.PRODUCT,
    productName: "French Fries",
    minQty: 1,
    discountType: DiscountType.FIXED,
    value: 20,
    active: true,
  },
  {
    name: "Dessert Lovers",
    target: PromotionTarget.PRODUCT,
    productName: "Chocolate Brownie",
    minQty: 2,
    discountType: DiscountType.PERCENT,
    value: 15,
    active: true,
  },
  {
    name: "Big Spender Discount",
    target: PromotionTarget.ORDER,
    minOrderAmount: 1000,
    discountType: DiscountType.PERCENT,
    value: 5,
    active: true,
  },
  {
    name: "Mega Order Bonus",
    target: PromotionTarget.ORDER,
    minOrderAmount: 2000,
    discountType: DiscountType.PERCENT,
    value: 8,
    active: true,
  },
  {
    name: "Weekday Lunch Offer",
    target: PromotionTarget.ORDER,
    minOrderAmount: 500,
    discountType: DiscountType.FIXED,
    value: 50,
    active: false,
  },
];

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

const FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan",
  "Ananya", "Diya", "Saanvi", "Aadhya", "Kiara", "Myra", "Pari", "Anika", "Riya", "Navya",
];

const LAST_NAMES = [
  "Sharma", "Verma", "Gupta", "Singh", "Kumar", "Patel", "Reddy", "Nair", "Iyer", "Mehta",
  "Joshi", "Rao", "Choudhury", "Das", "Bose", "Kapoor", "Malhotra", "Chopra", "Bhatt", "Pillai",
];

function buildCustomers(count: number): Prisma.CustomerCreateManyInput[] {
  return Array.from({ length: count }, (_, i) => {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3 + 7) % LAST_NAMES.length];
    const hasEmail = i % 4 !== 0;
    const hasPhone = i % 5 !== 0;

    return {
      id: randomUUID(),
      name: `${first} ${last}`,
      email: hasEmail ? `${first.toLowerCase()}.${last.toLowerCase()}${i}@example.com` : null,
      phone: hasPhone ? `+91 9${String(randomInt(0, 999999999)).padStart(9, "0")}` : null,
    };
  });
}

// ---------------------------------------------------------------------------
// Order totals (mirrors lib/pricing.ts computeOrderTotals, without DB access)
// ---------------------------------------------------------------------------

type SeedOrderItem = { productId: string; unitPrice: number; qty: number; tax: number };

type SeedPromotion = {
  target: PromotionTarget;
  productId: string | null;
  minQty: number | null;
  minOrderAmount: number | null;
  discountType: DiscountType;
  value: number;
};

type SeedCoupon = { discountType: DiscountType; value: number } | null;

function computeTotals(items: SeedOrderItem[], promotions: SeedPromotion[], coupon: SeedCoupon) {
  let subtotal = 0;
  let tax = 0;
  const lineDiscounts: number[] = [];

  for (const item of items) {
    const lineAmount = item.unitPrice * item.qty;
    let lineDiscount = 0;

    for (const promo of promotions) {
      if (promo.target !== PromotionTarget.PRODUCT || promo.productId !== item.productId) continue;
      if (item.qty < (promo.minQty ?? 1)) continue;

      const discount = promo.discountType === DiscountType.PERCENT ? lineAmount * (promo.value / 100) : promo.value;
      const capped = Math.min(discount, lineAmount);
      if (capped > lineDiscount) lineDiscount = capped;
    }

    lineDiscounts.push(lineDiscount);
    const lineNet = lineAmount - lineDiscount;
    subtotal += lineNet;
    tax += lineNet * (item.tax / 100);
  }

  let promoDiscount = 0;
  for (const promo of promotions) {
    if (promo.target !== PromotionTarget.ORDER) continue;
    if (subtotal < (promo.minOrderAmount ?? 0)) continue;

    const discount = promo.discountType === DiscountType.PERCENT ? subtotal * (promo.value / 100) : promo.value;
    const capped = Math.min(discount, subtotal);
    if (capped > promoDiscount) promoDiscount = capped;
  }

  let couponDiscount = 0;
  if (coupon) {
    const remaining = subtotal - promoDiscount;
    const discount = coupon.discountType === DiscountType.PERCENT ? remaining * (coupon.value / 100) : coupon.value;
    couponDiscount = Math.max(0, Math.min(discount, remaining));
  }

  const discount = promoDiscount + couponDiscount;
  const total = subtotal - discount + tax;

  return {
    subtotal: round2(subtotal),
    tax: round2(tax),
    discount: round2(discount),
    total: round2(total),
    lineDiscounts: lineDiscounts.map(round2),
  };
}

// ---------------------------------------------------------------------------
// Date helpers for the 30-day order history
// ---------------------------------------------------------------------------

const now = new Date();

function dateDaysAgo(daysAgo: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function randomTimeOnDay(base: Date, isToday: boolean): Date {
  const d = new Date(base);
  const openMinutes = 9 * 60;
  let closeMinutes = 22 * 60;

  if (isToday) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    closeMinutes = Math.max(openMinutes + 30, Math.min(closeMinutes, nowMinutes));
  }

  const minutes = randomInt(openMinutes, closeMinutes);
  d.setHours(Math.floor(minutes / 60), minutes % 60, randomInt(0, 59), randomInt(0, 999));
  return d;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const DAYS_OF_HISTORY = 30;

async function main() {
  console.log("Clearing existing catalog & transactional data...");
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.posSession.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.table.deleteMany();
  await prisma.floor.deleteMany();
  await prisma.paymentMethod.deleteMany();

  console.log("Creating demo users (admin + employees)...");
  const users = await seedUsers();
  const employees = users.filter((u) => u.role === Role.EMPLOYEE);
  const staffPool = employees.length > 0 ? employees : users;

  console.log("Creating categories & products...");
  const categoryIdByName = new Map<string, string>();
  await prisma.category.createMany({
    data: CATEGORIES.map((c) => {
      const id = randomUUID();
      categoryIdByName.set(c.name, id);
      return { id, name: c.name, color: c.color };
    }),
  });

  const productIdByName = new Map<string, string>();
  const productInfo = new Map<string, { price: number; tax: number; active: boolean }>();
  await prisma.product.createMany({
    data: PRODUCTS.map((p) => {
      const id = randomUUID();
      const tax = p.tax ?? 5;
      const active = p.active ?? true;
      productIdByName.set(p.name, id);
      productInfo.set(id, { price: p.price, tax, active });
      return {
        id,
        name: p.name,
        price: p.price,
        unit: p.unit,
        tax,
        categoryId: categoryIdByName.get(p.category)!,
        showOnKds: p.showOnKds ?? true,
        active,
      };
    }),
  });

  const orderableProductIds = Array.from(productInfo.entries())
    .filter(([, info]) => info.active)
    .map(([id]) => id);

  console.log("Creating floors & tables...");
  const tableIds: string[] = [];
  for (const floor of FLOORS) {
    const floorId = randomUUID();
    await prisma.floor.create({ data: { id: floorId, name: floor.name } });
    await prisma.table.createMany({
      data: floor.tables.map((t) => {
        const id = randomUUID();
        tableIds.push(id);
        return { id, number: t.number, seats: t.seats, floorId };
      }),
    });
  }

  console.log("Creating payment methods...");
  await prisma.paymentMethod.createMany({
    data: PAYMENT_METHODS.map((m) => ({ id: randomUUID(), ...m })),
  });

  console.log("Creating coupons...");
  const couponIdByCode = new Map<string, string>();
  await prisma.coupon.createMany({
    data: COUPONS.map((c) => {
      const id = randomUUID();
      couponIdByCode.set(c.code, id);
      return { id, ...c };
    }),
  });
  const activeCoupons = COUPONS.filter((c) => c.active);

  console.log("Creating promotions...");
  const activePromotions: SeedPromotion[] = [];
  await prisma.promotion.createMany({
    data: PROMOTIONS.map((p) => {
      const id = randomUUID();
      const productId = p.target === PromotionTarget.PRODUCT ? productIdByName.get(p.productName!)! : null;
      const row = {
        id,
        name: p.name,
        target: p.target,
        productId,
        minQty: p.minQty ?? null,
        minOrderAmount: p.minOrderAmount ?? null,
        discountType: p.discountType,
        value: p.value,
        active: p.active,
      };
      if (p.active) {
        activePromotions.push({
          target: row.target,
          productId: row.productId,
          minQty: row.minQty,
          minOrderAmount: row.minOrderAmount,
          discountType: row.discountType,
          value: row.value,
        });
      }
      return row;
    }),
  });

  console.log("Creating customers...");
  const customerRows = buildCustomers(40);
  await prisma.customer.createMany({ data: customerRows });
  const customerIds = customerRows.map((c) => c.id as string);

  // -------------------------------------------------------------------------
  // 30 days of POS sessions + orders + order items
  // -------------------------------------------------------------------------

  console.log(`Generating ${DAYS_OF_HISTORY} days of POS sessions and orders...`);

  const sessionRows: Prisma.PosSessionCreateManyInput[] = [];
  const orderRows: Prisma.OrderCreateManyInput[] = [];
  const itemRows: Prisma.OrderItemCreateManyInput[] = [];

  let orderCounter = 0;

  for (let daysAgo = DAYS_OF_HISTORY - 1; daysAgo >= 0; daysAgo--) {
    const isToday = daysAgo === 0;
    const day = dateDaysAgo(daysAgo);

    const sessionId = randomUUID();
    const opener = randomItem(staffPool);

    let openedAt: Date;
    let closedAt: Date | null;

    if (isToday) {
      const nineAm = new Date(day);
      nineAm.setHours(9, 0, 0, 0);
      openedAt = nineAm.getTime() < now.getTime() ? nineAm : new Date(now.getTime() - 5 * 60 * 1000);
      closedAt = null;
    } else {
      openedAt = new Date(day);
      openedAt.setHours(9, 0, 0, 0);
      closedAt = new Date(day);
      closedAt.setHours(23, randomInt(0, 59), 0, 0);
    }

    const openingAmount = 2000;
    let cashTotal = 0;

    const numOrders = randomInt(8, 16);

    for (let i = 0; i < numOrders; i++) {
      orderCounter += 1;
      const orderId = randomUUID();
      const createdAt = randomTimeOnDay(day, isToday);

      const itemCount = randomInt(1, 4);
      const chosenProductIds = pickUnique(orderableProductIds, itemCount);

      const items: SeedOrderItem[] = chosenProductIds.map((productId) => {
        const info = productInfo.get(productId)!;
        return { productId, unitPrice: info.price, qty: randomInt(1, 3), tax: info.tax };
      });

      const status = weighted<"PAID" | "CANCELLED">(["PAID", 88], ["CANCELLED", 12]);
      const applyCoupon = status === "PAID" && activeCoupons.length > 0 && Math.random() < 0.15;
      const chosenCoupon = applyCoupon ? randomItem(activeCoupons) : null;
      const coupon: SeedCoupon = chosenCoupon
        ? { discountType: chosenCoupon.discountType, value: chosenCoupon.value }
        : null;
      const couponId = chosenCoupon ? couponIdByCode.get(chosenCoupon.code) : undefined;

      const totals = computeTotals(items, activePromotions, coupon);

      const tableId = Math.random() < 0.7 ? randomItem(tableIds) : null;
      const customerId = Math.random() < 0.5 ? randomItem(customerIds) : null;
      const createdBy = randomItem(staffPool);

      const orderData: Prisma.OrderCreateManyInput = {
        id: orderId,
        number: `ORD-${String(orderCounter).padStart(4, "0")}`,
        status,
        subtotal: totals.subtotal,
        tax: totals.tax,
        discount: totals.discount,
        total: totals.total,
        tableId,
        customerId,
        sessionId,
        couponId,
        createdById: createdBy.id,
        createdAt,
        updatedAt: createdAt,
      };

      if (status === "PAID") {
        const paidAt = new Date(createdAt.getTime() + randomInt(5, 30) * 60 * 1000);
        const paymentType = weighted<"CASH" | "CARD" | "UPI">(["CASH", 45], ["CARD", 30], ["UPI", 25]);
        const paidBy = randomItem(staffPool);

        orderData.paidAt = paidAt;
        orderData.paidById = paidBy.id;
        orderData.paymentType = paymentType;
        orderData.updatedAt = paidAt;

        if (paymentType === "CASH") {
          const tendered = roundTo(totals.total, totals.total > 500 ? 100 : totals.total > 100 ? 50 : 10);
          orderData.amountTendered = tendered;
          orderData.changeDue = round2(tendered - totals.total);
          cashTotal += totals.total;
        } else if (paymentType === "CARD") {
          orderData.paymentRef = `TXN${randomInt(100000, 999999)}`;
        } else {
          orderData.paymentRef = `UPI${randomInt(100000000, 999999999)}`;
        }
      } else {
        const cancelledAt = new Date(createdAt.getTime() + randomInt(2, 15) * 60 * 1000);
        orderData.cancelledAt = cancelledAt;
        orderData.updatedAt = cancelledAt;
      }

      orderRows.push(orderData);

      items.forEach((item, idx) => {
        itemRows.push({
          id: randomUUID(),
          orderId,
          productId: item.productId,
          qty: item.qty,
          unitPrice: item.unitPrice,
          lineDiscount: totals.lineDiscounts[idx],
          kdsStatus: "COMPLETED",
          kdsItemDone: true,
          createdAt,
          updatedAt: createdAt,
        });
      });
    }

    const expectedCash = openingAmount + cashTotal;

    sessionRows.push({
      id: sessionId,
      openedAt,
      closedAt,
      openingAmount,
      closingAmount: isToday ? null : round2(expectedCash + randomInt(-50, 50)),
      expectedCash: isToday ? null : round2(expectedCash),
      openedById: opener.id,
      closedById: isToday ? null : randomItem(staffPool).id,
    });
  }

  // -------------------------------------------------------------------------
  // A handful of "active" DRAFT tickets for today, sent to the kitchen,
  // so the POS table view and KDS board have live data to display.
  // -------------------------------------------------------------------------

  console.log("Creating today's active draft orders (currently at tables)...");

  const todaySessionId = sessionRows[sessionRows.length - 1].id as string;
  const activeTables = pickUnique(tableIds, 4);
  const kdsStages: ("TO_COOK" | "PREPARING" | "COMPLETED")[] = ["TO_COOK", "TO_COOK", "PREPARING", "COMPLETED"];

  for (const tableId of activeTables) {
    orderCounter += 1;
    const orderId = randomUUID();
    const createdAt = new Date(now.getTime() - randomInt(2, 25) * 60 * 1000);

    const itemCount = randomInt(1, 3);
    const chosenProductIds = pickUnique(orderableProductIds, itemCount);

    const items: SeedOrderItem[] = chosenProductIds.map((productId) => {
      const info = productInfo.get(productId)!;
      return { productId, unitPrice: info.price, qty: randomInt(1, 2), tax: info.tax };
    });

    const totals = computeTotals(items, activePromotions, null);
    const createdBy = randomItem(staffPool);

    orderRows.push({
      id: orderId,
      number: `ORD-${String(orderCounter).padStart(4, "0")}`,
      status: "DRAFT",
      subtotal: totals.subtotal,
      tax: totals.tax,
      discount: totals.discount,
      total: totals.total,
      tableId,
      customerId: Math.random() < 0.3 ? randomItem(customerIds) : null,
      sessionId: todaySessionId,
      createdById: createdBy.id,
      createdAt,
      updatedAt: createdAt,
    });

    items.forEach((item, idx) => {
      const kdsStatus = randomItem(kdsStages);
      itemRows.push({
        id: randomUUID(),
        orderId,
        productId: item.productId,
        qty: item.qty,
        unitPrice: item.unitPrice,
        lineDiscount: totals.lineDiscounts[idx],
        kdsStatus,
        kdsItemDone: kdsStatus === "COMPLETED",
        createdAt,
        updatedAt: createdAt,
      });
    });
  }

  console.log(`Inserting ${sessionRows.length} POS sessions...`);
  await prisma.posSession.createMany({ data: sessionRows });

  console.log(`Inserting ${orderRows.length} orders...`);
  await prisma.order.createMany({ data: orderRows });

  console.log(`Inserting ${itemRows.length} order items...`);
  await prisma.orderItem.createMany({ data: itemRows });

  console.log("\nSeed complete.\n");
  console.log("Summary:");
  console.log(`  Categories:   ${CATEGORIES.length}`);
  console.log(`  Products:     ${PRODUCTS.length}`);
  console.log(`  Floors:       ${FLOORS.length}`);
  console.log(`  Tables:       ${tableIds.length}`);
  console.log(`  Customers:    ${customerIds.length}`);
  console.log(`  Coupons:      ${COUPONS.length}`);
  console.log(`  Promotions:   ${PROMOTIONS.length}`);
  console.log(`  POS sessions: ${sessionRows.length} (today's session is left open)`);
  console.log(`  Orders:       ${orderRows.length}`);
  console.log(`  Order items:  ${itemRows.length}`);
  console.log("\nDemo logins (password for all: " + DEMO_PASSWORD + "):");
  for (const demo of DEMO_USERS) {
    console.log(`  ${demo.role.padEnd(8)} ${demo.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
