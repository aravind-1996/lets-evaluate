"use client";

import { FieldInput, FieldLabel } from "@/components/FormField";
import { cn } from "@/lib/utils";

export function UsernameField({
  id,
  value,
  onChange,
  emailDomain,
  error,
  autoComplete = "username",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  emailDomain: string;
  error?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <FieldLabel htmlFor={id}>Username</FieldLabel>
      <div className="relative">
        <FieldInput
          id={id}
          type="text"
          inputMode="email"
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. nuthan or nuthan.m"
          aria-invalid={!!error}
          aria-describedby={`${id}-domain ${error ? `${id}-error` : ""}`}
          className={cn(error && "border-red-400 focus:border-red-500")}
        />
      </div>
      <p
        id={`${id}-domain`}
        className="mt-1.5 text-sm text-[var(--ink-soft)]"
      >
        Your sign-in email:{" "}
        <span className="font-semibold text-[var(--ink)]">
          {value.trim() ? value.trim().toLowerCase() : "username"}
          <span className="text-[var(--cyan-d)]">@{emailDomain}</span>
        </span>
      </p>
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
