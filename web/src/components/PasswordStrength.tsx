"use client";

import { getPasswordStrength } from "@/lib/auth/validation";
import { cn } from "@/lib/utils";

export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, checks } = getPasswordStrength(password);
  const barColor =
    score <= 2
      ? "bg-red-500"
      : score === 3
        ? "bg-[var(--orange)]"
        : score === 4
          ? "bg-[var(--cyan)]"
          : "bg-[var(--green)]";

  const requirements = [
    { key: "minLength", label: "At least 8 characters", met: checks.minLength },
    { key: "uppercase", label: "One uppercase letter", met: checks.uppercase },
    { key: "lowercase", label: "One lowercase letter", met: checks.lowercase },
    { key: "number", label: "One number", met: checks.number },
    { key: "special", label: "One special character", met: checks.special },
  ] as const;

  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex items-center gap-2">
        <div className="flex h-1.5 flex-1 gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={cn(
                "h-full flex-1 rounded-full bg-[var(--cream-2)] transition-colors",
                i <= score && barColor,
              )}
            />
          ))}
        </div>
        <span className="text-[11px] font-semibold text-[var(--ink-soft)]">
          {label}
        </span>
      </div>
      <ul className="grid grid-cols-1 gap-0.5 text-[11px] sm:grid-cols-2">
        {requirements.map(({ key, label: reqLabel, met }) => (
          <li
            key={key}
            className={cn(
              "flex items-center gap-1.5",
              met ? "text-[var(--green)]" : "text-[var(--ink-faint)]",
            )}
          >
            <span aria-hidden>{met ? "✓" : "○"}</span>
            {reqLabel}
          </li>
        ))}
      </ul>
    </div>
  );
}
