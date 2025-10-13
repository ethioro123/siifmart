import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = (searchParams.get("code") || "").trim();
  if (!code) return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const product = await prisma.product.findFirst({
    where: {
      OR: [{ sku: code }, { barcode: code }],
    },
    select: { id: true, sku: true, name: true, price: true },
  });

  if (!product) return NextResponse.json({ found: false });
  return NextResponse.json({ found: true, product });
}
