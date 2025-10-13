import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  const items: { productId?: string; sku?: string; quantity: number; price: number }[] = body.items || [];
  const cashierId: string | undefined = body.cashierId;

  if (!items.length || !cashierId) {
    return NextResponse.json({ error: "Missing items or cashier." }, { status: 400 });
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = 0;
  const total = subtotal + tax;

  const sale = await prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        cashierId,
        status: "COMPLETED",
        subtotal,
        tax,
        total,
      },
    });

    for (const line of items) {
      const product = line.productId
        ? await tx.product.findUnique({ where: { id: line.productId } })
        : await tx.product.findUnique({ where: { sku: line.sku! } });
      if (!product) throw new Error("Product not found");
      await tx.saleItem.create({
        data: {
          saleId: sale.id,
          productId: product.id,
          quantity: line.quantity,
          price: line.price,
        },
      });
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: { decrement: line.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: product.id,
          type: "SALE",
          quantity: -line.quantity,
          note: `Sale ${sale.id}`,
          saleId: sale.id,
        },
      });
    }

    return sale;
  });

  return NextResponse.json({ ok: true, saleId: sale.id, total });
}
