import Link from "next/link";

export function Nav() {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex gap-4 p-4 text-sm">
        <Link href="/dashboard" className="hover:underline">Dashboard</Link>
        <Link href="/products" className="hover:underline">Products</Link>
        <Link href="/pos" className="hover:underline">POS</Link>
      </nav>
    </header>
  );
}
