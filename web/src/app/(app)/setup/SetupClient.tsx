"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";

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

export function SetupClient({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"projects" | "roles" | "questions">("projects");
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
    <main className="px-7 py-6">
      <h1 className="font-serif text-2xl font-bold">Your team&apos;s toolkit</h1>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">Projects, roles &amp; questions</p>

      <div className="mt-6 flex gap-2">
        {(["projects", "roles", "questions"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-2 text-xs font-bold capitalize ${
              tab === t
                ? "bg-[var(--cyan)] text-white"
                : "bg-white text-[var(--ink-soft)]"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "projects" && (
        <>
          <div className="mt-8 space-y-3">
            {projects.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 rounded-[22px] border-2 border-transparent bg-white p-5 hover:border-[var(--cyan-soft)]"
              >
                <div className="grid size-[52px] place-items-center rounded-2xl bg-[var(--cyan-soft)] text-sm font-extrabold text-[var(--cyan-d)]">
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {(p.techStack ?? []).join(" · ") || "No tech stack"}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-[22px] border-2 border-dashed border-[var(--cream-2)] p-6">
            <h3 className="font-bold">Add project</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <input
              value={stack}
              onChange={(e) => setStack(e.target.value)}
              placeholder="Tech stack (comma-separated)"
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <Button className="mt-3" onClick={addProject} disabled={loading || !name}>
              Save project
            </Button>
          </div>
        </>
      )}

      {tab === "roles" && (
        <>
          <div className="mt-8 space-y-3">
            {roles.map((r) => (
              <div key={r.id} className="rounded-[22px] bg-white p-5">
                <h3 className="font-bold">{r.name}</h3>
                <p className="text-xs text-[var(--ink-faint)]">
                  {r.requirements || "No requirements"}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-[22px] border-2 border-dashed border-[var(--cream-2)] p-6">
            <h3 className="font-bold">Add role</h3>
            <input
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="Role name"
              className="mt-3 w-full rounded-xl border px-3 py-2 text-sm"
            />
            <select
              value={roleProjectId}
              onChange={(e) => setRoleProjectId(e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">Link to project (optional)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <textarea
              value={roleReqs}
              onChange={(e) => setRoleReqs(e.target.value)}
              placeholder="Requirements"
              className="mt-2 min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm"
            />
            <Button className="mt-3" onClick={addRole} disabled={loading || !roleName}>
              Save role
            </Button>
          </div>
        </>
      )}

      {tab === "questions" && (
        <>
          <div className="mt-8 space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="rounded-[22px] bg-white p-5 text-sm">
                {q.questionText}
                <p className="mt-1 text-xs text-[var(--ink-faint)]">
                  {q.category} · {q.difficulty}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-[22px] border-2 border-dashed border-[var(--cream-2)] p-6">
            <h3 className="font-bold">Add question</h3>
            <textarea
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Question text"
              className="mt-3 min-h-[80px] w-full rounded-xl border px-3 py-2 text-sm"
            />
            <select
              value={qRoleId}
              onChange={(e) => setQRoleId(e.target.value)}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
            >
              <option value="">Any role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <Button className="mt-3" onClick={addQuestion} disabled={loading || !qText}>
              Save question
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
