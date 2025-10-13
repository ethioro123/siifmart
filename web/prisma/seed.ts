import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

async function main() {
  const prisma = new PrismaClient();
  // Ensure settings row exists
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {},
  });

  const email = "admin@siifmart.local";
  const passwordHash = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN" as any },
    create: {
      email,
      name: "Admin",
      role: "ADMIN" as any,
      passwordHash,
    },
  });

  // A couple of sample categories and products
  const cat = await prisma.category.upsert({
    where: { name: "General" },
    update: {},
    create: { name: "General" },
  });

  await prisma.product.upsert({
    where: { sku: "MILK-1L" },
    update: {},
    create: {
      sku: "MILK-1L",
      name: "Milk 1L",
      price: 30 as any,
      cost: 25 as any,
      stockQuantity: 25,
      categoryId: cat.id,
    },
  });

  await prisma.product.upsert({
    where: { sku: "BREAD-STD" },
    update: {},
    create: {
      sku: "BREAD-STD",
      name: "Bread Loaf",
      price: 20 as any,
      cost: 15 as any,
      stockQuantity: 40,
      categoryId: cat.id,
    },
  });
}

main()
  .then(async () => {
    // eslint-disable-next-line no-process-exit
    process.exit(0);
  })
  .catch(async (e) => {
    console.error(e);
    // eslint-disable-next-line no-process-exit
    process.exit(1);
  });
