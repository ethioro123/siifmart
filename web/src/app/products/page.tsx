import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Link href="/products/new" className="rounded bg-black text-white px-3 py-2">New</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-2 text-left">SKU</th>
              <th className="p-2 text-left">Name</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Stock</th>
              <th className="p-2"/>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="p-2 font-mono">{p.sku}</td>
                <td className="p-2">{p.name}</td>
                <td className="p-2 text-right">{Number(p.price).toFixed(2)}</td>
                <td className="p-2 text-right">{p.stockQuantity}</td>
                <td className="p-2 text-right">
                  <Link href={`/products/${p.id}`} className="underline">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
