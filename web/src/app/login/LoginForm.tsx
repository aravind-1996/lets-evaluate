"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { FieldInput, FieldLabel } from "@/components/FormField";

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
        <FieldLabel htmlFor="email">Work email</FieldLabel>
        <FieldInput
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@kanini.com"
          autoComplete="email"
        />
      </div>
      <div>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <FieldInput
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" className="mt-2 w-full" disabled={loading}>
        {loading ? "Signing in…" : "Enter workspace →"}
      </Button>
      <p className="text-center text-xs text-[var(--ink-faint)]">
        Forgot password? Contact your admin
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
