"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFrame } from "@/components/AuthFrame";
import { useBrand } from "@/components/BrandContext";
import { Button } from "@/components/Button";
import { FieldInput, FieldLabel, FieldSelect } from "@/components/FormField";
import { PasswordStrengthMeter } from "@/components/PasswordStrength";
import { UsernameField } from "@/components/UsernameField";
import type { MemberRole } from "@/lib/auth/config";
import {
  ROLE_LABELS,
  validatePassword,
  validateUsername,
} from "@/lib/auth/validation";

export default function RegisterPage() {
  const router = useRouter();
  const brand = useBrand();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<MemberRole>("ta");
  const [fieldErrors, setFieldErrors] = useState<{
    name?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    role?: string;
  }>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const errors: typeof fieldErrors = {};
    if (!name.trim()) errors.name = "Full name is required";
    else if (name.trim().length < 2)
      errors.name = "Full name must be at least 2 characters";

    const usernameError = validateUsername(username);
    if (usernameError) errors.username = usernameError;

    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    else if (password !== confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    if (!role) errors.role = "Please select a role";

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setLoading(true);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        username: username.trim(),
        password,
        confirmPassword,
        role,
      }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Registration failed. Please try again.");
      return;
    }
    router.push("/login?registered=1");
  }

  return (
    <AuthFrame activeTab="register">
      <h1 className="font-serif text-2xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        Set up your team&apos;s evaluation workspace
      </p>
      <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
        <div>
          <FieldLabel htmlFor="name">Full name</FieldLabel>
          <FieldInput
            id="name"
            placeholder="Priya Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (fieldErrors.name)
                setFieldErrors((err) => ({ ...err, name: undefined }));
            }}
            aria-invalid={!!fieldErrors.name}
            className={fieldErrors.name ? "border-red-400" : undefined}
          />
          {fieldErrors.name && (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {fieldErrors.name}
            </p>
          )}
        </div>

        <UsernameField
          id="reg-username"
          value={username}
          onChange={(v) => {
            setUsername(v);
            if (fieldErrors.username)
              setFieldErrors((err) => ({ ...err, username: undefined }));
          }}
          emailDomain={brand.emailDomain}
          error={fieldErrors.username}
        />

        <div>
          <FieldLabel htmlFor="role">Your role</FieldLabel>
          <FieldSelect
            id="role"
            value={role}
            onChange={(e) => setRole(e.target.value as MemberRole)}
          >
            {(Object.keys(ROLE_LABELS) as MemberRole[]).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </FieldSelect>
          <p className="mt-1 text-[11px] text-[var(--ink-faint)]">
            Your dashboard and available tools depend on this role.
          </p>
        </div>

        <div>
          <FieldLabel htmlFor="reg-password">Password</FieldLabel>
          <FieldInput
            id="reg-password"
            type="password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (fieldErrors.password)
                setFieldErrors((err) => ({ ...err, password: undefined }));
            }}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.password}
            className={fieldErrors.password ? "border-red-400" : undefined}
          />
          <PasswordStrengthMeter password={password} />
          {fieldErrors.password && (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {fieldErrors.password}
            </p>
          )}
        </div>

        <div>
          <FieldLabel htmlFor="reg-confirm-password">Confirm password</FieldLabel>
          <FieldInput
            id="reg-confirm-password"
            type="password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (fieldErrors.confirmPassword)
                setFieldErrors((err) => ({ ...err, confirmPassword: undefined }));
            }}
            autoComplete="new-password"
            aria-invalid={!!fieldErrors.confirmPassword}
            className={fieldErrors.confirmPassword ? "border-red-400" : undefined}
          />
          {fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-sm text-red-600" role="alert">
              {fieldErrors.confirmPassword}
            </p>
          )}
          {confirmPassword && password === confirmPassword && !fieldErrors.confirmPassword && (
            <p className="mt-1.5 text-sm text-[var(--green)]">Passwords match</p>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="mt-2 w-full" disabled={loading}>
          {loading ? "Creating…" : "Create workspace →"}
        </Button>
      </form>
    </AuthFrame>
  );
}
