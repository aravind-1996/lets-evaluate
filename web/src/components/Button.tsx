import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "main" | "ghost" | "outline";
};

export function Button({
  variant = "main",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-bold transition-colors disabled:opacity-50",
        variant === "main" &&
          "bg-[var(--ink)] text-white hover:bg-[var(--cyan-d)]",
        variant === "ghost" &&
          "border-2 border-[var(--ink)] bg-transparent text-[var(--ink)] hover:bg-[var(--cream-2)]",
        variant === "outline" &&
          "border border-[var(--cream-2)] bg-white text-[var(--ink)] hover:border-[var(--cyan)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "main",
  className,
  children,
}: {
  href: string;
  variant?: "main" | "ghost";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm font-bold transition-colors",
        variant === "main" &&
          "bg-[var(--ink)] text-white hover:bg-[var(--cyan-d)]",
        variant === "ghost" &&
          "border-2 border-[var(--ink)] bg-transparent text-[var(--ink)] hover:bg-[var(--cream-2)]",
        className,
      )}
    >
      {children}
    </Link>
  );
}
