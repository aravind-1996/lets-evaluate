"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { CabinetPage } from "@/components/CabinetPage";
import { FieldInput, FieldLabel, FieldSelect, FieldTextarea } from "@/components/FormField";
import { cn } from "@/lib/utils";

type Project = {
  id: string;
  name: string;
  techStack: string[] | null;
};

type Role = {
  id: string;
  name: string;
  level: string | null;
  requirements: string | null;
  projectId: string | null;
};

type Tab = "projects" | "roles";
type ViewMode = "grid" | "list";

const folderColors = ["bg-[var(--cyan)]", "bg-[var(--green)]", "bg-[var(--navy)]"];

export function SetupClient({
  projects: initialProjects,
  initialTab = "projects",
}: {
  projects: Project[];
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [view, setView] = useState<ViewMode>("grid");

  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [roles, setRoles] = useState<Role[]>([]);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {});
  }, []);

  async function refreshProjects() {
    const r = await fetch("/api/projects");
    if (r.ok) setProjects(await r.json());
    router.refresh();
  }

  async function refreshRoles() {
    const r = await fetch("/api/roles");
    if (r.ok) setRoles(await r.json());
  }

  const projectName = (id: string | null) =>
    projects.find((p) => p.id === id)?.name ?? null;

  return (
    <CabinetPage
      title="Project files"
      subtitle="Configure hiring context once — reuse everywhere"
    >
      <div className="case-banner mb-5">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--cyan)] text-white text-xl font-bold">
          +
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold">Configure once, evaluate forever</h2>
          <p className="mt-1 text-[13px] text-white/65">
            Set up your projects and roles here — reuse them across every evaluation
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--cream-2)] pb-4">
        <div className="flex gap-2">
          {(["projects", "roles"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                "rounded-full px-4 py-2 text-xs font-bold capitalize transition-colors",
                tab === t
                  ? "bg-[var(--cyan)] text-white"
                  : "bg-white text-[var(--ink-soft)] hover:bg-[var(--cream-2)]",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {tab === "projects" ? (
        <ProjectsTab
          view={view}
          projects={projects}
          onChanged={refreshProjects}
        />
      ) : (
        <RolesTab
          view={view}
          roles={roles}
          projects={projects}
          projectName={projectName}
          onChanged={refreshRoles}
        />
      )}
    </CabinetPage>
  );
}

function ViewToggle({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-[var(--cream-2)] bg-white p-0.5">
      {(["grid", "list"] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={view === v}
          title={v === "grid" ? "Tiles" : "List"}
          className={cn(
            "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold capitalize transition-colors",
            view === v
              ? "bg-[var(--cyan-soft)] text-[var(--cyan-d)]"
              : "text-[var(--ink-faint)] hover:text-[var(--ink)]",
          )}
        >
          {v === "grid" ? <GridIcon /> : <ListIcon />}
          {v === "grid" ? "Tiles" : "List"}
        </button>
      ))}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 mt-8 flex items-center gap-3">
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
        {children}
      </h3>
      <div className="h-px flex-1 bg-[var(--cream-2)]" />
    </div>
  );
}

/* ---------------------------------- Projects --------------------------------- */

function ProjectsTab({
  view,
  projects,
  onChanged,
}: {
  view: ViewMode;
  projects: Project[];
  onChanged: () => void | Promise<void>;
}) {
  return (
    <div>
      <ProjectCreateForm onChanged={onChanged} />

      <SectionHeading>
        {projects.length} {projects.length === 1 ? "project" : "projects"}
      </SectionHeading>

      {projects.length === 0 ? (
        <EmptyState label="No projects yet — create your first one above." />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              colorIndex={i}
              onChanged={onChanged}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--cream-2)] bg-white">
          {projects.map((p, i) => (
            <ProjectRow
              key={p.id}
              project={p}
              last={i === projects.length - 1}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCreateForm({ onChanged }: { onChanged: () => void | Promise<void> }) {
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        techStack: stack.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setLoading(false);
    setName("");
    setStack("");
    await onChanged();
  }

  return (
    <div className="case-card p-5 md:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--cyan-soft)] text-[var(--cyan-d)] text-sm font-bold">
          +
        </span>
        <h3 className="font-bold">Create a project</h3>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Project name</FieldLabel>
          <FieldInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Payments Platform"
          />
        </div>
        <div>
          <FieldLabel>Tech stack</FieldLabel>
          <FieldInput
            value={stack}
            onChange={(e) => setStack(e.target.value)}
            placeholder="Comma-separated, e.g. React, Node, Postgres"
          />
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={save} disabled={loading || !name}>
          {loading ? "Saving…" : "Create project"}
        </Button>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  colorIndex,
  onChanged,
}: {
  project: Project;
  colorIndex: number;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const tags = project.techStack ?? [];

  if (editing) {
    return (
      <div className="case-card p-5">
        <ProjectEditForm
          project={project}
          onClose={() => setEditing(false)}
          onChanged={onChanged}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="case-card case-card-hover group overflow-hidden text-left"
    >
      <div className={cn("case-folder-tab", folderColors[colorIndex % folderColors.length])} />
      <div className="border-t border-[var(--cream-2)] p-5 pt-6">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-serif text-lg font-bold">{project.name}</h3>
          <span className="shrink-0 rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-faint)] opacity-0 transition-opacity group-hover:opacity-100">
            Edit
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.length ? (
            tags.map((tag) => (
              <span
                key={tag}
                className="rounded border border-[var(--cream-2)] bg-[var(--cream)] px-2 py-0.5 text-[10px] font-semibold"
              >
                {tag}
              </span>
            ))
          ) : (
            <span className="text-xs text-[var(--ink-faint)]">No tech stack configured</span>
          )}
        </div>
      </div>
    </button>
  );
}

function ProjectRow({
  project,
  last,
  onChanged,
}: {
  project: Project;
  last: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const tags = project.techStack ?? [];

  if (editing) {
    return (
      <div className={cn("p-5", !last && "border-b border-[var(--cream-2)]")}>
        <ProjectEditForm
          project={project}
          onClose={() => setEditing(false)}
          onChanged={onChanged}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--cream)]",
        !last && "border-b border-[var(--cream-2)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="font-bold">{project.name}</div>
        <div className="mt-0.5 truncate text-xs text-[var(--ink-faint)]">
          {tags.join(" · ") || "No tech stack configured"}
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold text-[var(--cyan-d)]">Edit</span>
    </button>
  );
}

function ProjectEditForm({
  project,
  onClose,
  onChanged,
}: {
  project: Project;
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [name, setName] = useState(project.name);
  const [stack, setStack] = useState((project.techStack ?? []).join(", "));
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch(`/api/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        techStack: stack.split(",").map((s) => s.trim()).filter(Boolean),
      }),
    });
    setLoading(false);
    onClose();
    await onChanged();
  }

  async function remove() {
    if (!confirm(`Delete project "${project.name}"?`)) return;
    setLoading(true);
    await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    setLoading(false);
    onClose();
    await onChanged();
  }

  return (
    <div>
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cyan-d)]">
        Editing project
      </div>
      <div>
        <FieldLabel>Project name</FieldLabel>
        <FieldInput value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="mt-3">
        <FieldLabel>Tech stack</FieldLabel>
        <FieldInput
          value={stack}
          onChange={(e) => setStack(e.target.value)}
          placeholder="Comma-separated"
        />
      </div>
      <EditActions loading={loading} disabled={!name} onSave={save} onCancel={onClose} onDelete={remove} />
    </div>
  );
}

/* ----------------------------------- Roles ----------------------------------- */

function RolesTab({
  view,
  roles,
  projects,
  projectName,
  onChanged,
}: {
  view: ViewMode;
  roles: Role[];
  projects: Project[];
  projectName: (id: string | null) => string | null;
  onChanged: () => void | Promise<void>;
}) {
  return (
    <div>
      <RoleCreateForm projects={projects} onChanged={onChanged} />

      <SectionHeading>
        {roles.length} {roles.length === 1 ? "role" : "roles"}
      </SectionHeading>

      {roles.length === 0 ? (
        <EmptyState label="No roles yet — create your first one above." />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((r) => (
            <RoleCard
              key={r.id}
              role={r}
              projects={projects}
              projectName={projectName}
              onChanged={onChanged}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[var(--cream-2)] bg-white">
          {roles.map((r, i) => (
            <RoleRow
              key={r.id}
              role={r}
              projects={projects}
              projectName={projectName}
              last={i === roles.length - 1}
              onChanged={onChanged}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RoleCreateForm({
  projects,
  onChanged,
}: {
  projects: Project[];
  onChanged: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [projectId, setProjectId] = useState("");
  const [requirements, setRequirements] = useState("");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        level: level || undefined,
        projectId: projectId || undefined,
        requirements,
      }),
    });
    setLoading(false);
    setName("");
    setLevel("");
    setProjectId("");
    setRequirements("");
    await onChanged();
  }

  return (
    <div className="case-card p-5 md:p-6">
      <div className="flex items-center gap-2">
        <span className="grid size-7 place-items-center rounded-lg bg-[var(--cyan-soft)] text-[var(--cyan-d)] text-sm font-bold">
          +
        </span>
        <h3 className="font-bold">Create a role</h3>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel>Role name</FieldLabel>
          <FieldInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Backend Engineer"
          />
        </div>
        <div>
          <FieldLabel>Level</FieldLabel>
          <FieldInput
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="e.g. Senior (optional)"
          />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Project</FieldLabel>
          <FieldSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">Link to project (optional)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </FieldSelect>
        </div>
        <div className="sm:col-span-2">
          <FieldLabel>Requirements</FieldLabel>
          <FieldTextarea
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
            placeholder="Key skills and expectations for this role"
          />
        </div>
      </div>
      <div className="mt-4">
        <Button onClick={save} disabled={loading || !name}>
          {loading ? "Saving…" : "Create role"}
        </Button>
      </div>
    </div>
  );
}

function RoleCard({
  role,
  projects,
  projectName,
  onChanged,
}: {
  role: Role;
  projects: Project[];
  projectName: (id: string | null) => string | null;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const linked = projectName(role.projectId);

  if (editing) {
    return (
      <div className="case-card p-5">
        <RoleEditForm
          role={role}
          projects={projects}
          onClose={() => setEditing(false)}
          onChanged={onChanged}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="case-card case-card-hover group p-5 text-left"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-bold">{role.name}</h3>
          {role.level && (
            <span className="mt-1 inline-block rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-soft)]">
              {role.level}
            </span>
          )}
        </div>
        <span className="shrink-0 rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-faint)] opacity-0 transition-opacity group-hover:opacity-100">
          Edit
        </span>
      </div>
      <p className="mt-2 line-clamp-3 text-xs text-[var(--ink-faint)]">
        {role.requirements || "No requirements"}
      </p>
      {linked && (
        <p className="mt-3 text-[11px] font-semibold text-[var(--cyan-d)]">{linked}</p>
      )}
    </button>
  );
}

function RoleRow({
  role,
  projects,
  projectName,
  last,
  onChanged,
}: {
  role: Role;
  projects: Project[];
  projectName: (id: string | null) => string | null;
  last: boolean;
  onChanged: () => void | Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const linked = projectName(role.projectId);

  if (editing) {
    return (
      <div className={cn("p-5", !last && "border-b border-[var(--cream-2)]")}>
        <RoleEditForm
          role={role}
          projects={projects}
          onClose={() => setEditing(false)}
          onChanged={onChanged}
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[var(--cream)]",
        !last && "border-b border-[var(--cream-2)]",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-bold">{role.name}</span>
          {role.level && (
            <span className="rounded-full bg-[var(--cream)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink-soft)]">
              {role.level}
            </span>
          )}
          {linked && (
            <span className="text-[11px] font-semibold text-[var(--cyan-d)]">· {linked}</span>
          )}
        </div>
        <div className="mt-0.5 truncate text-xs text-[var(--ink-faint)]">
          {role.requirements || "No requirements"}
        </div>
      </div>
      <span className="shrink-0 text-xs font-bold text-[var(--cyan-d)]">Edit</span>
    </button>
  );
}

function RoleEditForm({
  role,
  projects,
  onClose,
  onChanged,
}: {
  role: Role;
  projects: Project[];
  onClose: () => void;
  onChanged: () => void | Promise<void>;
}) {
  const [name, setName] = useState(role.name);
  const [level, setLevel] = useState(role.level ?? "");
  const [projectId, setProjectId] = useState(role.projectId ?? "");
  const [requirements, setRequirements] = useState(role.requirements ?? "");
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    await fetch(`/api/roles/${role.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        level: level || undefined,
        projectId: projectId || undefined,
        requirements,
      }),
    });
    setLoading(false);
    onClose();
    await onChanged();
  }

  async function remove() {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    setLoading(true);
    await fetch(`/api/roles/${role.id}`, { method: "DELETE" });
    setLoading(false);
    onClose();
    await onChanged();
  }

  return (
    <div>
      <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--cyan-d)]">
        Editing role
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <FieldLabel>Role name</FieldLabel>
          <FieldInput value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Level</FieldLabel>
          <FieldInput
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="Optional"
          />
        </div>
      </div>
      <div className="mt-3">
        <FieldLabel>Project</FieldLabel>
        <FieldSelect value={projectId} onChange={(e) => setProjectId(e.target.value)}>
          <option value="">Link to project (optional)</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </FieldSelect>
      </div>
      <div className="mt-3">
        <FieldLabel>Requirements</FieldLabel>
        <FieldTextarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
        />
      </div>
      <EditActions loading={loading} disabled={!name} onSave={save} onCancel={onClose} onDelete={remove} />
    </div>
  );
}

/* --------------------------------- Shared UI --------------------------------- */

function EditActions({
  loading,
  disabled,
  onSave,
  onCancel,
  onDelete,
}: {
  loading: boolean;
  disabled: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      <div className="flex gap-2">
        <Button onClick={onSave} disabled={loading || disabled}>
          {loading ? "Saving…" : "Save"}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
      </div>
      <button
        type="button"
        onClick={onDelete}
        disabled={loading}
        className="rounded-lg px-3 py-2 text-xs font-bold text-[var(--red,#c0392b)] transition-colors hover:bg-[var(--cream)] disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="rounded-xl border-2 border-dashed border-[var(--cream-2)] px-6 py-12 text-center text-sm text-[var(--ink-faint)]">
      {label}
    </div>
  );
}

function GridIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="0.5" y="0.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
      <rect x="7" y="0.5" width="4.5" height="4.5" rx="1" fill="currentColor" />
      <rect x="0.5" y="7" width="4.5" height="4.5" rx="1" fill="currentColor" />
      <rect x="7" y="7" width="4.5" height="4.5" rx="1" fill="currentColor" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect x="0" y="1" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="5" width="12" height="2" rx="1" fill="currentColor" />
      <rect x="0" y="9" width="12" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}
