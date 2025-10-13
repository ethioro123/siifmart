import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const adminEmail = 'admin@siifmart.local'
  const adminPassword = 'Admin123!'
  const passwordHash = await bcrypt.hash(adminPassword, 10)

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: 'Administrator',
      passwordHash,
      role: 'ADMIN',
    },
  })

  const supplier = await prisma.supplier.upsert({
    where: { name: 'Default Supplier' },
    update: {},
    create: {
      name: 'Default Supplier',
      email: 'supplier@example.com',
      phone: '+251900000000',
      address: 'Addis Ababa',
    },
  })

  const products = [
    { name: 'Bananas (1kg)', sku: 'BAN-1KG', barcode: '200000000001', category: 'Fruits', unit: 'kg', costCents: 3000, priceCents: 4500, stockQuantity: 50 },
    { name: 'Milk 1L', sku: 'MLK-1L', barcode: '200000000002', category: 'Dairy', unit: 'bottle', costCents: 2000, priceCents: 2800, stockQuantity: 80 },
    { name: 'Bread Loaf', sku: 'BRD-LOAF', barcode: '200000000003', category: 'Bakery', unit: 'loaf', costCents: 1200, priceCents: 1800, stockQuantity: 40 },
    { name: 'Eggs (12)', sku: 'EGG-12', barcode: '200000000004', category: 'Dairy', unit: 'pack', costCents: 3500, priceCents: 4800, stockQuantity: 30 },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        barcode: p.barcode,
        category: p.category,
        unit: p.unit,
        costCents: p.costCents,
        priceCents: p.priceCents,
        stockQuantity: p.stockQuantity,
      },
    })
  }

  console.log('Seed complete. Admin login:', adminEmail, adminPassword)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
