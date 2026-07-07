"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { FieldInput, FieldLabel } from "@/components/FormField";
import { UsernameField } from "@/components/UsernameField";
import {
  buildEmail,
  validateUsername,
} from "@/lib/auth/validation";

export function LoginForm({ emailDomain }: { emailDomain: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/people";
  const registered = params.get("registered") === "1";
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    username?: string;
    password?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;
    if (!password.trim()) errors.password = "Password is required";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    const email = buildEmail(username, emailDomain);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);

    if (res?.error) {
      setError("Invalid username or password. Please check your credentials and try again.");
      return;
    }

    router.replace(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {registered && (
        <p className="rounded-lg bg-[var(--green-soft)] px-3 py-2 text-sm text-[var(--green)]">
          Account created successfully. Sign in with your username and password.
        </p>
      )}
      <UsernameField
        id="username"
        value={username}
        onChange={(v) => {
          setUsername(v);
          if (fieldErrors.username) setFieldErrors((e) => ({ ...e, username: undefined }));
        }}
        emailDomain={emailDomain}
        error={fieldErrors.username}
        autoComplete="username"
      />
      <div>
        <FieldLabel htmlFor="password">Password</FieldLabel>
        <FieldInput
          id="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password)
              setFieldErrors((err) => ({ ...err, password: undefined }));
          }}
          autoComplete="current-password"
          aria-invalid={!!fieldErrors.password}
          className={fieldErrors.password ? "border-red-400" : undefined}
        />
        {fieldErrors.password && (
          <p className="mt-1.5 text-sm text-red-600" role="alert">
            {fieldErrors.password}
          </p>
        )}
      </div>
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      )}
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
