"use client";

import Link from "next/link";
import { useBrand } from "@/components/BrandContext";
import { splitAppTitle } from "@/lib/brand";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "grid size-10 shrink-0 place-items-center rounded-xl bg-[var(--ink)] text-white shadow-sm",
        className,
      )}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden
      >
        <line x1="12" y1="3" x2="12" y2="21" />
        <path d="M3 6l9-3 9 3" />
        <path d="M6 10l-3 6h6z" />
        <path d="M18 10l-3 6h6z" />
      </svg>
    </span>
  );
}

export function Logo({
  href = "/",
  light = false,
  className,
}: {
  href?: string;
  light?: boolean;
  className?: string;
}) {
  const brand = useBrand();
  const { prefix: titlePrefix, accent: titleAccent } = splitAppTitle(
    brand.appTitle,
    brand.appTitleAccent,
  );

  return (
    <Link href={href} className={cn("flex items-center gap-3 no-underline", className)}>
      {brand.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={brand.logoUrl}
          alt={brand.appTitle}
          className="h-10 w-auto shrink-0 object-contain"
        />
      ) : (
        <LogoMark className={light ? "bg-[var(--cyan)]" : undefined} />
      )}
      <span
        className={cn(
          "font-serif text-[1.2rem] leading-none",
          light ? "text-white" : "text-[var(--ink)]",
        )}
      >
        {titleAccent ? (
          <>
            {titlePrefix}
            {titlePrefix ? " " : ""}
            <em className="text-[var(--cyan-d)] not-italic">{titleAccent}</em>
          </>
        ) : (
          brand.appTitle
        )}
      </span>
    </Link>
  );
}
