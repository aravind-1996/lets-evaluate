import { Suspense } from "react";
import { AuthFrame } from "@/components/AuthFrame";
import { getBrand } from "@/lib/brand";
import { LoginForm } from "./LoginForm";

export default function LoginPage() {
  const brand = getBrand();

  return (
    <AuthFrame activeTab="signin">
      <h1 className="font-serif text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        Sign in to access your case files
      </p>
      <div className="mt-7">
        <Suspense fallback={<p className="text-sm">Loading…</p>}>
          <LoginForm emailPlaceholder={brand.emailPlaceholder} />
        </Suspense>
      </div>
    </AuthFrame>
  );
}
