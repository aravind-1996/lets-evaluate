"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Logo, LogoMark } from "@/components/Logo";
import { FaceAvatar } from "@/components/FaceAvatar";
import { LogoutButton } from "@/components/LogoutButton";
import { canManageSetup } from "@/lib/auth/capabilities";
import type { MemberRole } from "@/lib/auth/config";
import { cn } from "@/lib/utils";
import {
  DashboardIcon,
  ProjectsIcon,
  RolesIcon,
  OpeningsIcon,
  CandidatesIcon,
  InterviewersIcon,
  BookingIcon,
  PipelineIcon,
  AssignmentsIcon,
  ArchivesIcon,
  CollapseIcon,
} from "@/components/NavIcons";

type IconType = (props: { className?: string }) => React.ReactElement;

type NavItem = {
  href: string;
  label: string;
  icon: IconType;
  /** Optional query key that must match for this item to be "active". */
  matchTab?: string;
};

type NavSection = { label?: string; items: NavItem[] };

function navForRole(role: MemberRole): NavSection[] {
  if (!canManageSetup(role)) {
    return [
      {
        items: [
          { href: "/people", label: "Dashboard", icon: DashboardIcon },
          { href: "/assignments", label: "My Assignments", icon: AssignmentsIcon },
          { href: "/archive", label: "Archives", icon: ArchivesIcon },
        ],
      },
    ];
  }

  return [
    {
      items: [{ href: "/people", label: "Dashboard", icon: DashboardIcon }],
    },
    {
      label: "Configuration",
      items: [
        {
          href: "/setup?tab=projects",
          label: "Projects",
          icon: ProjectsIcon,
          matchTab: "projects",
        },
        {
          href: "/setup?tab=roles",
          label: "Roles",
          icon: RolesIcon,
          matchTab: "roles",
        },
        { href: "/openings", label: "Openings", icon: OpeningsIcon },
      ],
    },
    {
      label: "Talent",
      items: [
        { href: "/candidates", label: "Candidates", icon: CandidatesIcon },
        { href: "/interviewers", label: "Interviewers", icon: InterviewersIcon },
        { href: "/booking", label: "Booking", icon: BookingIcon },
      ],
    },
    {
      label: "Records",
      items: [
        { href: "/pipeline", label: "Pipeline", icon: PipelineIcon },
        { href: "/archive", label: "Archives", icon: ArchivesIcon },
      ],
    },
  ];
}

function mobileNavForRole(role: MemberRole) {
  const items = [
    { href: "/people", label: "Home" },
    { href: "/candidates", label: "People" },
    { href: "/evaluate/new", label: "+", accent: true as const },
    { href: "/booking", label: "Booking" },
    { href: "/archive", label: "Archive" },
  ];

  if (!canManageSetup(role)) {
    return [
      { href: "/people", label: "Home" },
      { href: "/assignments", label: "Assign" },
      { href: "/evaluate/new", label: "+", accent: true as const },
      { href: "/archive", label: "Archive" },
    ];
  }

  return items;
}

const STORAGE_KEY = "sidebar:collapsed";

const collapseStore = {
  listeners: new Set<() => void>(),
  get() {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  },
  toggle() {
    const next = !this.get();
    window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    this.listeners.forEach((l) => l());
  },
  subscribe(listener: () => void) {
    collapseStore.listeners.add(listener);
    return () => collapseStore.listeners.delete(listener);
  },
};

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
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  const collapsed = useSyncExternalStore(
    (l) => collapseStore.subscribe(l),
    () => collapseStore.get(),
    () => false,
  );

  function toggleCollapsed() {
    collapseStore.toggle();
  }

  const isEvaluateFocus =
    pathname.startsWith("/evaluate/") && !pathname.endsWith("/new");
  const sections = navForRole(userRole);

  function isActive(item: NavItem) {
    const path = item.href.split("?")[0];
    if (item.matchTab) {
      if (pathname !== path) return false;
      // No tab in the URL means the page renders its default ("projects") tab,
      // so highlight that item rather than leaving all sub-items inactive.
      if (!activeTab) return item.matchTab === "projects";
      return activeTab === item.matchTab;
    }
    if (path === "/people") return pathname === "/people";
    return pathname === path || pathname.startsWith(`${path}/`);
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] pb-20 md:pb-6 md:pt-6">
      <div
        className={cn(
          "case-cabinet mx-auto flex min-h-[calc(100vh-3rem)] max-w-[1180px] flex-col md:mx-6 md:flex-row md:items-start",
          isEvaluateFocus && "max-w-[1100px]",
        )}
      >
        <aside
          className={cn(
            "hidden shrink-0 flex-col border-b border-[var(--cream-2)] bg-[var(--cream-2)] transition-[width] duration-200 ease-out md:flex md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:rounded-l-xl md:border-b-0 md:border-r",
            collapsed ? "md:w-[74px]" : "md:w-[236px]",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-2 p-4",
              collapsed ? "justify-center px-2" : "justify-between",
            )}
          >
            {collapsed ? (
              <Link href="/people" aria-label="Home">
                <LogoMark />
              </Link>
            ) : (
              <Logo href="/people" />
            )}
            {!collapsed && (
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-[var(--ink-soft)] transition-colors hover:bg-white hover:text-[var(--ink)]"
              >
                <CollapseIcon className="size-[18px]" />
              </button>
            )}
          </div>

          {collapsed && (
            <div className="flex justify-center px-2 pb-1">
              <button
                type="button"
                onClick={toggleCollapsed}
                aria-label="Expand sidebar"
                title="Expand sidebar"
                className="grid size-8 place-items-center rounded-lg text-[var(--ink-soft)] transition-colors hover:bg-white hover:text-[var(--ink)]"
              >
                <CollapseIcon className="size-[18px] rotate-180" />
              </button>
            </div>
          )}

          <nav
            className="flex flex-1 flex-col gap-1 overflow-hidden px-2 py-2"
            aria-label="App navigation"
          >
            {sections.map((section, si) => (
              <div key={section.label ?? `s-${si}`} className="flex flex-col gap-0.5">
                {section.label &&
                  (collapsed ? (
                    <div className="mx-auto my-1.5 h-px w-6 bg-black/10" />
                  ) : (
                    <div className="px-3 pb-1 pt-3 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
                      {section.label}
                    </div>
                  ))}
                {section.items.map((item) => {
                  const on = isActive(item);
                  const Icon = item.icon;
                  return (
                    <div key={item.href} className="group/nav relative">
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "flex items-center rounded-lg text-[13px] font-semibold transition-colors",
                          collapsed
                            ? "justify-center px-2 py-2.5"
                            : "gap-3 px-3 py-2.5",
                          on
                            ? "bg-white text-[var(--ink)] shadow-[inset_3px_0_0_var(--cyan)]"
                            : "text-[var(--ink-soft)] hover:bg-white/60 hover:text-[var(--ink)]",
                        )}
                      >
                        <span
                          className={cn(
                            "grid size-8 shrink-0 place-items-center rounded-lg border transition-colors",
                            on
                              ? "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan-d)]"
                              : "border-[var(--cream-2)] bg-white/40 text-[var(--ink-soft)]",
                          )}
                        >
                          <Icon className="size-[18px]" />
                        </span>
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                      {collapsed && (
                        <span
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--ink)] px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/nav:opacity-100"
                        >
                          {item.label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>

          <div
            className={cn(
              "shrink-0 border-t border-[var(--cream-2)]",
              collapsed ? "flex flex-col items-center gap-2 p-2" : "p-3",
            )}
          >
            {collapsed ? (
              <>
                <div className="group/nav relative">
                  <span title={userName}>
                    <FaceAvatar name={userName} size="sm" />
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-1/2 left-full z-50 ml-2 translate-y-1/2 whitespace-nowrap rounded-md bg-[var(--ink)] px-2.5 py-1.5 text-[12px] font-semibold text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/nav:opacity-100"
                  >
                    {userName} · {userRole.replace(/_/g, " ")}
                  </span>
                </div>
                <LogoutButton
                  compact
                  className="grid size-9 place-items-center rounded-lg p-0"
                />
              </>
            ) : (
              <>
                <div className="mb-2 flex items-center gap-2.5 rounded-lg px-1 py-1">
                  <FaceAvatar name={userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-bold">{userName}</div>
                    <div className="truncate text-[11px] capitalize text-[var(--ink-faint)]">
                      {userRole.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
                <LogoutButton />
              </>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col bg-white md:min-h-[calc(100vh-3rem)] md:rounded-r-xl">
          <div className="flex items-center justify-between border-b border-[var(--cream-2)] px-4 py-3 md:hidden">
            <div className="flex min-w-0 items-center gap-2">
              <FaceAvatar name={userName} size="sm" />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-bold">{userName}</div>
                <div className="truncate text-[11px] capitalize text-[var(--ink-faint)]">
                  {userRole.replace(/_/g, " ")}
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
