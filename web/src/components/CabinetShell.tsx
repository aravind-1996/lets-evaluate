"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/Logo";
import { FaceAvatar } from "@/components/FaceAvatar";
import { LogoutButton } from "@/components/LogoutButton";
import { canManageSetup } from "@/lib/auth/capabilities";
import type { MemberRole } from "@/lib/auth/config";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: string };

function navForRole(role: MemberRole): NavItem[] {
  const base: NavItem[] = [
    { href: "/people", label: "Dashboard", icon: "▦" },
    { href: "/assignments", label: "Assignments", icon: "◎" },
    { href: "/evaluate", label: "Evaluate", icon: "?" },
    { href: "/archive", label: "Archives", icon: "▤" },
  ];

  if (canManageSetup(role)) {
    base.splice(3, 0, { href: "/setup", label: "Projects", icon: "📁" });
  }

  return base;
}

function mobileNavForRole(role: MemberRole) {
  const items = [
    { href: "/people", label: "Home" },
    { href: "/assignments", label: "Assign" },
    { href: "/evaluate/new", label: "+", accent: true as const },
    { href: "/archive", label: "Archive" },
  ];

  if (canManageSetup(role)) {
    items.splice(3, 0, { href: "/setup", label: "Setup" });
  }

  return items;
}

export function CabinetShell({
  userName,
  userRole,
  children,
}: {
  userName: string;
  userRole: MemberRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isEvaluateFocus =
    pathname.startsWith("/evaluate/") && !pathname.endsWith("/new");
  const drawers = navForRole(userRole);

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-20 md:pb-6 md:pt-6">
      <div
        className={cn(
          "case-cabinet mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1180px] flex-col md:mx-6 md:flex-row",
          isEvaluateFocus && "max-w-[1100px]",
        )}
      >
        <aside className="hidden w-[220px] shrink-0 flex-col border-b border-[var(--cream-2)] bg-[var(--cream-2)] md:flex md:rounded-l-xl md:border-b-0 md:border-r">
          <div className="p-5 pb-6">
            <Logo href="/people" />
          </div>
          <nav className="flex flex-1 flex-col" aria-label="App navigation">
            {drawers.map(({ href, label, icon }) => {
              const on =
                pathname === href ||
                (href !== "/people" && pathname.startsWith(href));
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-5 py-3.5 text-[13px] font-semibold transition-colors",
                    on
                      ? "border-l-4 border-[var(--cyan)] bg-white font-bold text-[var(--ink)]"
                      : "border-l-4 border-transparent text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-8 place-items-center rounded-lg border border-[var(--cream-2)] text-sm",
                      on && "border-[var(--cyan)] bg-[var(--cyan-soft)]",
                    )}
                  >
                    {icon}
                  </span>
                  {label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-[var(--cream-2)] p-4">
            <div className="mb-2 flex items-center gap-2.5">
              <FaceAvatar name={userName} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-bold">{userName}</div>
                <div className="truncate text-[11px] capitalize text-[var(--ink-faint)]">
                  {userRole.replace(/_/g, " ")}
                </div>
              </div>
            </div>
            <LogoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white md:rounded-r-xl">
          <div className="flex items-center justify-between border-b border-[var(--cream-2)] px-4 py-3 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <FaceAvatar name={userName} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold">{userName}</div>
                <div className="truncate text-[11px] capitalize text-[var(--ink-faint)]">
                  {userRole}
                </div>
              </div>
            </div>
            <LogoutButton className="!w-auto shrink-0 rounded-full px-3 py-1.5 text-[11px]" />
          </div>
          {children}
        </div>
      </div>

      <MobileNav pathname={pathname} role={userRole} />
    </div>
  );
}

function MobileNav({
  pathname,
  role,
}: {
  pathname: string;
  role: MemberRole;
}) {
  const items = mobileNavForRole(role);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-[var(--cream-2)] bg-white px-2 py-2 md:hidden"
      aria-label="Mobile navigation"
    >
      {items.map(({ href, label, accent }) => {
        const on =
          pathname === href ||
          (href !== "/people" && pathname.startsWith(href.replace("/new", "")));
        if (accent) {
          return (
            <Link
              key={href}
              href={href}
              className="grid size-11 place-items-center rounded-full bg-[var(--green)] text-xl font-bold text-white shadow-md"
              aria-label="New evaluation"
            >
              +
            </Link>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-full px-3 py-2 text-[10px] font-bold",
              on
                ? "bg-[var(--cyan-soft)] text-[var(--cyan-d)]"
                : "text-[var(--ink-faint)]",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
