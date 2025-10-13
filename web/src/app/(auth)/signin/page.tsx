"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await signIn("credentials", {
      redirect: true,
      email,
      password,
      callbackUrl: "/dashboard",
    });
    if (res?.error) setError(res.error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <form onSubmit={handleSignIn} className="w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border rounded px-3 py-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border rounded px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          className="w-full bg-black text-white rounded px-3 py-2"
        >
          Continue
        </button>
      </form>
    </div>
  );
}
