"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CaseCard } from "@/components/CabinetPage";
import { Pill } from "@/components/Pill";
import { cn } from "@/lib/utils";

export type OpeningRole = {
  id: string;
  name: string;
  level: string | null;
  requirements: string | null;
  projectId: string | null;
  projectIds: string[] | null;
  status: "open" | "closed";
  createdAt: string;
  closedAt: string | null;
};

export type OpeningProject = {
  id: string;
  name: string;
  techStack: string[] | null;
};

export type RoleStats = {
  total: number;
  selected: number;
  rejected: number;
  hold: number;
  inProgress: number;
};

type Filter = "all" | "open" | "closed";

const emptyStats: RoleStats = {
  total: 0,
  selected: 0,
  rejected: 0,
  hold: 0,
  inProgress: 0,
};

function formatDate(value: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function OpeningsBoard({
  projects,
  roles: initialRoles,
  stats,
}: {
  projects: OpeningProject[];
  roles: OpeningRole[];
  stats: Record<string, RoleStats>;
}) {
  const router = useRouter();
  const [roles, setRoles] = useState<OpeningRole[]>(initialRoles);
  const [filter, setFilter] = useState<Filter>("open");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleStatus(role: OpeningRole) {
    const next = role.status === "open" ? "closed" : "open";
    setBusyId(role.id);
    const res = await fetch(`/api/roles/${role.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusyId(null);
    if (!res.ok) return;
    setRoles((prev) =>
      prev.map((r) =>
        r.id === role.id
          ? {
              ...r,
              status: next,
              closedAt: next === "closed" ? new Date().toISOString() : null,
            }
          : r,
      ),
    );
    router.refresh();
  }

  const rolesForProject = (projectId: string) =>
    roles.filter(
      (r) =>
        r.projectId === projectId || (r.projectIds ?? []).includes(projectId),
    );

  const unassigned = roles.filter(
    (r) => !r.projectId && (r.projectIds ?? []).length === 0,
  );

  const matchesFilter = (role: OpeningRole) =>
    filter === "all" ? true : role.status === filter;

  const counts = useMemo(() => {
    const open = roles.filter((r) => r.status === "open").length;
    return { all: roles.length, open, closed: roles.length - open };
  }, [roles]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {(["open", "closed", "all"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-xs font-bold capitalize transition-colors",
              filter === f
                ? "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan-d)]"
                : "border-[var(--cream-2)] bg-white text-[var(--ink-faint)] hover:text-[var(--ink)]",
            )}
          >
            {f} ({counts[f]})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        {projects.map((project) => {
          const projectRoles = rolesForProject(project.id).filter(matchesFilter);
          const openCount = rolesForProject(project.id).filter(
            (r) => r.status === "open",
          ).length;
          return (
            <CaseCard key={project.id} className="overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cream-2)] bg-[var(--cream)] px-5 py-4">
                <div className="min-w-0">
                  <h2 className="font-serif text-lg font-bold">{project.name}</h2>
                  <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                    {(project.techStack ?? []).join(" · ") ||
                      "No tech stack configured"}
                  </p>
                </div>
                <Pill variant={openCount ? "cyan" : "neutral"}>
                  {openCount} open
                </Pill>
              </div>
              {projectRoles.length === 0 ? (
                <p className="px-5 py-4 text-sm text-[var(--ink-faint)]">
                  {filter === "all"
                    ? "No roles linked to this project yet."
                    : `No ${filter} roles for this project.`}
                </p>
              ) : (
                <ul className="divide-y divide-[var(--cream-2)]">
                  {projectRoles.map((role) => (
                    <OpeningRow
                      key={role.id}
                      role={role}
                      stats={stats[role.id] ?? emptyStats}
                      busy={busyId === role.id}
                      onToggle={() => toggleStatus(role)}
                    />
                  ))}
                </ul>
              )}
            </CaseCard>
          );
        })}

        {unassigned.filter(matchesFilter).length > 0 && (
          <CaseCard className="overflow-hidden xl:col-span-2">
            <div className="border-b border-[var(--cream-2)] bg-[var(--cream)] px-5 py-4">
              <h2 className="font-serif text-lg font-bold">Unassigned roles</h2>
              <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                Roles not yet linked to a project
              </p>
            </div>
            <ul className="divide-y divide-[var(--cream-2)]">
              {unassigned.filter(matchesFilter).map((role) => (
                <OpeningRow
                  key={role.id}
                  role={role}
                  stats={stats[role.id] ?? emptyStats}
                  busy={busyId === role.id}
                  onToggle={() => toggleStatus(role)}
                />
              ))}
            </ul>
          </CaseCard>
        )}
      </div>
    </div>
  );
}

function OpeningRow({
  role,
  stats,
  busy,
  onToggle,
}: {
  role: OpeningRole;
  stats: RoleStats;
  busy: boolean;
  onToggle: () => void;
}) {
  const opened = formatDate(role.createdAt);
  const closed = formatDate(role.closedAt);
  const isOpen = role.status === "open";

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-[var(--ink)]">{role.name}</strong>
            {role.level ? (
              <span className="rounded-md bg-[var(--cream)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-soft)]">
                {role.level}
              </span>
            ) : null}
            <Pill variant={isOpen ? "green" : "neutral"}>
              {isOpen ? "Open" : "Closed"}
            </Pill>
          </div>
          <p className="mt-1 line-clamp-1 text-xs text-[var(--ink-faint)]">
            {role.requirements || "No requirements captured"}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          disabled={busy}
          className={cn(
            "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50",
            isOpen
              ? "border-[var(--cream-2)] bg-white text-[var(--ink-soft)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
              : "border-[var(--green)]/30 bg-[var(--green-soft)] text-[var(--green)] hover:border-[var(--green)]",
          )}
        >
          {busy ? "Saving…" : isOpen ? "Close opening" : "Reopen"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCell label="Selected" value={stats.selected} tone="green" />
        <StatCell label="In progress" value={stats.inProgress} tone="cyan" />
        <StatCell label="On hold" value={stats.hold} tone="neutral" />
        <StatCell label="Rejected" value={stats.rejected} tone="neutral" />
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--ink-faint)]">
        {opened ? <span>Opened {opened}</span> : null}
        {closed ? (
          <span className="text-[var(--ink-soft)]">· Closed {closed}</span>
        ) : null}
        <span>· {stats.total} candidate{stats.total !== 1 ? "s" : ""}</span>
      </div>
    </li>
  );
}

function StatCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "cyan" | "neutral";
}) {
  const toneClass =
    tone === "green"
      ? "text-[var(--green)]"
      : tone === "cyan"
        ? "text-[var(--cyan-d)]"
        : "text-[var(--ink-soft)]";
  return (
    <div className="rounded-lg border border-[var(--cream-2)] bg-[var(--cream)] px-3 py-2">
      <div className={cn("font-serif text-xl leading-none", toneClass)}>
        {value}
      </div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--ink-faint)]">
        {label}
      </div>
    </div>
  );
}
