import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

async function upsertProduct(formData: FormData) {
  "use server";
  const id = formData.get("id") as string | null;
  const sku = String(formData.get("sku") || "");
  const name = String(formData.get("name") || "");
  const price = Number(formData.get("price") || 0);
  const cost = Number(formData.get("cost") || 0);
  const stockQuantity = Number(formData.get("stockQuantity") || 0);

  if (id) {
    await prisma.product.update({
      where: { id },
      data: { sku, name, price, cost, stockQuantity },
    });
  } else {
    await prisma.product.create({
      data: { sku, name, price, cost, stockQuantity },
    });
  }

  redirect("/products");
}

export default async function ProductForm({ params }: { params: { id?: string } }) {
  const product = params?.id ? await prisma.product.findUnique({ where: { id: params.id } }) : null;
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{product ? "Edit" : "New"} Product</h1>
      <form action={upsertProduct} className="grid gap-4 max-w-xl">
        <input type="hidden" name="id" defaultValue={product?.id || ""} />
        <label className="grid gap-1">
          <span>SKU</span>
          <input name="sku" defaultValue={product?.sku || ""} className="border rounded px-3 py-2" />
        </label>
        <label className="grid gap-1">
          <span>Name</span>
          <input name="name" defaultValue={product?.name || ""} className="border rounded px-3 py-2" />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="grid gap-1">
            <span>Price</span>
            <input type="number" step="0.01" name="price" defaultValue={product?.price ? Number(product.price) : 0} className="border rounded px-3 py-2" />
          </label>
          <label className="grid gap-1">
            <span>Cost</span>
            <input type="number" step="0.01" name="cost" defaultValue={product?.cost ? Number(product.cost) : 0} className="border rounded px-3 py-2" />
          </label>
        </div>
        <label className="grid gap-1">
          <span>Stock</span>
          <input type="number" name="stockQuantity" defaultValue={product?.stockQuantity || 0} className="border rounded px-3 py-2" />
        </label>
        <div className="flex gap-2">
          <button className="rounded bg-black text-white px-4 py-2">Save</button>
        </div>
      </form>
    </div>
  );
}
