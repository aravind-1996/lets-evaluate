import { cn } from "@/lib/utils";

const variants = {
  cyan: "bg-[var(--cyan-soft)] text-[var(--cyan-d)]",
  green: "bg-[var(--green-soft)] text-[var(--green)]",
  orange: "bg-[var(--orange-soft)] text-[var(--orange)]",
  neutral: "bg-[var(--cream-2)] text-[var(--ink-soft)]",
} as const;

type PillProps = {
  children: React.ReactNode;
  variant?: keyof typeof variants;
  className?: string;
};

export function Pill({ children, variant = "cyan", className }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold",
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
