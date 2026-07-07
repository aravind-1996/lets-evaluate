"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";
import { FieldInput, FieldSelect, FieldTextarea } from "@/components/FormField";

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
};

type Question = {
  id: string;
  questionText: string;
  category: string | null;
  difficulty: string | null;
};

const folderColors = ["bg-[var(--cyan)]", "bg-[var(--green)]", "bg-[var(--navy)]"];

export function SetupClient({
  projects,
  initialTab = "projects",
}: {
  projects: Project[];
  initialTab?: "projects" | "roles" | "questions";
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"projects" | "roles" | "questions">(initialTab);
  const [name, setName] = useState("");
  const [stack, setStack] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleReqs, setRoleReqs] = useState("");
  const [roleProjectId, setRoleProjectId] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qText, setQText] = useState("");
  const [qRoleId, setQRoleId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {});
    fetch("/api/questions")
      .then((r) => r.json())
      .then(setQuestions)
      .catch(() => {});
  }, []);

  async function addProject() {
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
    router.refresh();
  }

  async function addRole() {
    setLoading(true);
    await fetch("/api/roles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: roleName,
        projectId: roleProjectId || undefined,
        requirements: roleReqs,
      }),
    });
    setLoading(false);
    setRoleName("");
    setRoleReqs("");
    const r = await fetch("/api/roles");
    setRoles(await r.json());
  }

  async function addQuestion() {
    setLoading(true);
    await fetch("/api/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questionText: qText,
        roleId: qRoleId || undefined,
      }),
    });
    setLoading(false);
    setQText("");
    const r = await fetch("/api/questions");
    setQuestions(await r.json());
  }

  return (
    <CabinetPage
      title="Project files"
      subtitle="Configure hiring context once — reuse everywhere"
      actions={
        tab === "projects" ? (
          <Button className="px-5 py-2 text-[13px]" onClick={() => setTab("projects")}>
            + New project
          </Button>
        ) : undefined
      }
    >
      <div className="case-banner mb-5">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--cyan)] text-white text-xl font-bold">
          +
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold">Configure once, evaluate forever</h2>
          <p className="mt-1 text-[13px] text-white/65">
            Each project file contains roles, tech stacks, and a reusable question bank
          </p>
        </div>
      </div>

      <div className="mb-6 flex gap-2 border-b border-[var(--cream-2)] pb-4">
        {(["projects", "roles", "questions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-bold capitalize transition-colors ${
              tab === t
                ? "bg-[var(--cyan)] text-white"
                : "bg-white text-[var(--ink-soft)] hover:bg-[var(--cream-2)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "projects" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p, i) => (
              <article key={p.id} className="case-card case-card-hover overflow-hidden">
                <div
                  className={`case-folder-tab ${folderColors[i % folderColors.length]}`}
                />
                <div className="border-t border-[var(--cream-2)] p-5 pt-6">
                  <h3 className="font-serif text-lg font-bold">{p.name}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {(p.techStack ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-[var(--cream-2)] bg-[var(--cream)] px-2 py-0.5 text-[10px] font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-[var(--ink-faint)]">
                    {(p.techStack ?? []).join(" · ") || "No tech stack configured"}
                  </p>
                </div>
              </article>
            ))}
            <button
              type="button"
              onClick={() => document.getElementById("add-project")?.scrollIntoView({ behavior: "smooth" })}
              className="flex min-h-[180px] items-center justify-center rounded-xl border-2 border-dashed border-[var(--cream-2)] text-sm font-semibold text-[var(--ink-faint)] transition-colors hover:border-[var(--cyan)] hover:text-[var(--cyan-d)]"
            >
              + New project file
            </button>
          </div>
          <div id="add-project" className="case-card mt-6 p-6">
            <h3 className="font-bold">Add project</h3>
            <FieldInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="mt-3"
            />
            <FieldInput
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Tech stack (comma-separated)"
              className="mt-2"
            />
            <Button className="mt-3" onClick={addProject} disabled={loading || !name}>
              Save project
            </Button>
          </div>
        </>
      )}

      {tab === "roles" && (
        <>
          <div className="space-y-3">
            {roles.map((r) => (
              <CaseCard key={r.id} className="p-5">
                <h3 className="font-bold">{r.name}</h3>
                <p className="mt-1 text-xs text-[var(--ink-faint)]">
                  {r.requirements || "No requirements"}
                </p>
              </CaseCard>
            ))}
          </div>
          <CaseCard className="mt-6 p-6">
            <h3 className="font-bold">Add role</h3>
            <FieldInput
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role name"
              className="mt-3"
            />
            <FieldSelect
              value={roleProjectId}
              onChange={(e) => setRoleProjectId(e.target.value)}
              className="mt-2"
            >
              <option value="">Link to project (optional)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </FieldSelect>
            <FieldTextarea
              value={roleReqs}
              onChange={(e) => setRoleReqs(e.target.value)}
              placeholder="Requirements"
              className="mt-2"
            />
            <Button className="mt-3" onClick={addRole} disabled={loading || !roleName}>
              Save role
            </Button>
          </CaseCard>
        </>
      )}

      {tab === "questions" && (
        <>
          <div className="space-y-3">
            {questions.map((q) => (
              <CaseCard key={q.id} className="p-5 text-sm">
                {q.questionText}
                <p className="mt-1 text-xs text-[var(--ink-faint)]">
                  {q.category} · {q.difficulty}
                </p>
              </CaseCard>
            ))}
          </div>
          <CaseCard className="mt-6 p-6">
            <h3 className="font-bold">Add question</h3>
            <FieldTextarea
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Question text"
              className="mt-3"
            />
            <FieldSelect
              value={qRoleId}
              onChange={(e) => setQRoleId(e.target.value)}
              className="mt-2"
            >
              <option value="">Any role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </FieldSelect>
            <Button className="mt-3" onClick={addQuestion} disabled={loading || !qText}>
              Save question
            </Button>
          </CaseCard>
        </>
      )}
    </CabinetPage>
  );
}
