"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/Button";

type Project = { id: string; name: string };
type Role = { id: string; name: string; projectId: string | null };

export function NewCandidateClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [projectId, setProjectId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then(setProjects)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const url = projectId
      ? `/api/roles?projectId=${projectId}`
      : "/api/roles";
    fetch(url)
      .then((r) => r.json())
      .then(setRoles)
      .catch(() => {});
  }, [projectId]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("email", email);
    if (projectId) fd.set("projectId", projectId);
    if (roleId) fd.set("roleId", roleId);
    if (file) fd.set("resume", file);
    const res = await fetch("/api/candidates", { method: "POST", body: fd });
    const data = await res.json();
    setLoading(false);
    if (data.id) router.push(`/evaluate/${data.id}`);
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-md space-y-3 rounded-2xl bg-white p-6">
      <input
        required
        placeholder="Candidate name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      />
      <select
        value={projectId}
        onChange={(e) => {
          setProjectId(e.target.value);
          setRoleId("");
        }}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      >
        <option value="">Select project (optional)</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="w-full rounded-xl border px-3 py-2 text-sm"
      >
        <option value="">Select role (optional)</option>
        {roles.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name}
          </option>
        ))}
      </select>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-sm"
      />
      <Button type="submit" disabled={loading}>
        Start screening
      </Button>
    </form>
  );
}
