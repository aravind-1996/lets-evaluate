"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/Button";
import { FaceAvatar } from "@/components/FaceAvatar";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Registration failed");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream-2)] px-6 py-12">
      <div className="w-full max-w-md text-center">
        <FaceAvatar name={name || "You"} size="lg" className="mx-auto mb-4" />
        <h1 className="font-serif text-3xl font-extrabold">Create your workspace</h1>
        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-[32px] bg-white p-8 text-left shadow-[0_8px_40px_rgba(41,41,41,.08)]"
        >
          <input
            required
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-2xl border border-[var(--cream-2)] bg-[var(--cream)] px-4 py-3 text-sm"
          />
          <input
            required
            type="email"
            placeholder="you@kanini.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-2xl border border-[var(--cream-2)] bg-[var(--cream)] px-4 py-3 text-sm"
          />
          <input
            required
            type="password"
            minLength={8}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-2xl border border-[var(--cream-2)] bg-[var(--cream)] px-4 py-3 text-sm"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            Create workspace
          </Button>
          <p className="text-center text-xs text-[var(--ink-faint)]">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-[var(--cyan-d)]">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
