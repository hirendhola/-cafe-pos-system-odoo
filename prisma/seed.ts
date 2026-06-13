import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const categories = await Promise.all([
    prisma.category.create({ data: { name: "Beverages", color: "#0ea5e9" } }),
    prisma.category.create({ data: { name: "Starters", color: "#f97316" } }),
    prisma.category.create({ data: { name: "Main Course", color: "#16a34a" } }),
    prisma.category.create({ data: { name: "Desserts", color: "#ec4899" } }),
  ]);

  const [beverages, starters, mainCourse, desserts] = categories;

  await prisma.product.createMany({
    data: [
      { name: "Cappuccino", price: 150, unit: "cup", tax: 5, categoryId: beverages.id },
      { name: "Masala Chai", price: 60, unit: "cup", tax: 5, categoryId: beverages.id },
      { name: "Cold Coffee", price: 180, unit: "glass", tax: 5, categoryId: beverages.id },
      { name: "Fresh Lime Soda", price: 90, unit: "glass", tax: 5, categoryId: beverages.id },
      { name: "Veg Spring Rolls", price: 180, unit: "plate", tax: 5, categoryId: starters.id },
      { name: "Paneer Tikka", price: 240, unit: "plate", tax: 5, categoryId: starters.id },
      { name: "French Fries", price: 140, unit: "plate", tax: 5, categoryId: starters.id },
      { name: "Margherita Pizza", price: 320, unit: "pcs", tax: 5, categoryId: mainCourse.id },
      { name: "Veg Burger", price: 160, unit: "pcs", tax: 5, categoryId: mainCourse.id },
      { name: "Pasta Alfredo", price: 280, unit: "plate", tax: 5, categoryId: mainCourse.id },
      { name: "Butter Naan with Dal Makhani", price: 260, unit: "plate", tax: 5, categoryId: mainCourse.id },
      { name: "Chocolate Brownie", price: 150, unit: "pcs", tax: 5, categoryId: desserts.id },
      { name: "Gulab Jamun", price: 90, unit: "plate", tax: 5, categoryId: desserts.id },
    ],
  });

  const groundFloor = await prisma.floor.create({ data: { name: "Ground Floor" } });
  const terrace = await prisma.floor.create({ data: { name: "Terrace" } });

  await prisma.table.createMany({
    data: [
      { number: 1, seats: 4, floorId: groundFloor.id },
      { number: 2, seats: 4, floorId: groundFloor.id },
      { number: 3, seats: 2, floorId: groundFloor.id },
      { number: 4, seats: 6, floorId: groundFloor.id },
      { number: 1, seats: 4, floorId: terrace.id },
      { number: 2, seats: 2, floorId: terrace.id },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
