import { auth } from "@/lib/auth";

export default async function Dashboard() {
  const session = await auth();
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <pre className="text-sm bg-gray-100 p-3 rounded">{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
