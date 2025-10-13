"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function POS() {
  const [items, setItems] = useState<{ sku: string; name: string; price: number; qty: number }[]>([]);
  const [scan, setScan] = useState("");
  const router = useRouter();

  const total = useMemo(() => items.reduce((s, i) => s + i.price * i.qty, 0), [items]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter") {
        addScan();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scan]);

  function addScan() {
    const code = scan.trim();
    if (!code) return;
    // For demo, map MILK-1L and BREAD-STD
    const map: Record<string, { name: string; price: number }> = {
      "MILK-1L": { name: "Milk 1L", price: 30 },
      "BREAD-STD": { name: "Bread Loaf", price: 20 },
    };
    const meta = map[code];
    if (!meta) return setScan("");
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.sku === code);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { sku: code, name: meta.name, price: meta.price, qty: 1 }];
    });
    setScan("");
  }

  function checkout() {
    alert(`Paid ${total.toFixed(2)}`);
    setItems([]);
    router.push("/dashboard");
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">POS</h1>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-3">
          <div className="flex gap-2">
            <input
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              placeholder="Scan SKU or barcode and press Enter"
              className="border rounded px-3 py-2 w-full"
            />
            <button className="rounded bg-black text-white px-3" onClick={addScan}>Add</button>
          </div>
          <div className="border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-2 text-left">SKU</th>
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr key={i.sku} className="border-t">
                    <td className="p-2 font-mono">{i.sku}</td>
                    <td className="p-2">{i.name}</td>
                    <td className="p-2 text-right">{i.qty}</td>
                    <td className="p-2 text-right">{i.price.toFixed(2)}</td>
                    <td className="p-2 text-right">{(i.price * i.qty).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-3">
          <div className="border rounded p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Subtotal</span>
              <span className="font-medium">{total.toFixed(2)}</span>
            </div>
            <button disabled={!items.length} onClick={checkout} className="w-full rounded bg-black text-white px-4 py-2 disabled:opacity-50">Charge</button>
          </div>
        </div>
      </div>
    </div>
  );
}
