"use client";

import { SessionProvider } from "next-auth/react";
import { BrandProvider } from "@/components/BrandContext";
import type { BrandConfig } from "@/lib/brand";

export function Providers({
  brand,
  children,
}: {
  brand: BrandConfig;
  children: React.ReactNode;
}) {
  return (
    <BrandProvider brand={brand}>
      <SessionProvider>{children}</SessionProvider>
    </BrandProvider>
  );
}
