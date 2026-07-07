"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { useBrand } from "@/components/BrandContext";
import { Button } from "@/components/Button";
import { FieldInput, FieldLabel } from "@/components/FormField";

export default function RegisterPage() {
  const router = useRouter();
  const brand = useBrand();
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
    <AuthFrame activeTab="register">
      <h1 className="font-serif text-2xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        Set up your team&apos;s evaluation workspace
      </p>
      <form onSubmit={onSubmit} className="mt-7 space-y-4">
        <div>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <FieldInput
            id="name"
            required
            placeholder="Priya Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="reg-email">Work email</FieldLabel>
          <FieldInput
            id="reg-email"
            required
            type="email"
            placeholder={brand.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <FieldLabel htmlFor="reg-password">Password</FieldLabel>
          <FieldInput
            id="reg-password"
            required
            type="password"
            minLength={8}
            placeholder="Min. 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? "Creating…" : "Create workspace →"}
        </Button>
      </form>
    </AuthFrame>
  );
}
