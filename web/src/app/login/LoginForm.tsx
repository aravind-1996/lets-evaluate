"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/Button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/people";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email or password");
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
          Work email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-[var(--cream-2)] bg-[var(--cream)] px-4 py-3 text-sm focus:border-[var(--cyan)] focus:outline-none focus:ring-2 focus:ring-[var(--cyan-soft)]"
          placeholder="you@kanini.com"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-[var(--cream-2)] bg-[var(--cream)] px-4 py-3 text-sm focus:border-[var(--cyan)] focus:outline-none"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Enter workspace"}
      </Button>
      <p className="text-center text-xs text-[var(--ink-faint)]">
        No account?{" "}
        <Link href="/register" className="font-semibold text-[var(--cyan-d)]">
          Create one
        </Link>
      </p>
      {process.env.NEXT_PUBLIC_AZURE_SSO_ENABLED === "true" && (
        <Button
          type="button"
          variant="ghost"
          className="w-full"
          onClick={() => signIn("microsoft-entra-id", { callbackUrl })}
        >
          Sign in with Microsoft
        </Button>
      )}
    </form>
  );
}
