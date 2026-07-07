"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await signOut({ redirect: false });
      // replace() clears history entry so Back cannot return to authenticated pages
      window.location.replace("/");
    } catch {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={cn(
        "w-full rounded-lg px-3 py-2 text-left text-[12px] font-semibold text-[var(--ink-soft)] transition-colors hover:bg-white hover:text-red-600 disabled:opacity-50",
        className,
      )}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
