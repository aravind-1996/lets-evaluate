import { requireRole } from "@/lib/auth/rbac";
import { getCandidatesForUser } from "@/lib/db/queries";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Pill } from "@/components/Pill";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";
import Link from "next/link";

export default async function PipelinePage() {
  const session = await requireRole(["admin", "ta"]);
  const candidates = await getCandidatesForUser(
    session.user.organizationId,
    session.user.id,
    session.user.role,
  );

  const columns = [
    { key: "screening", label: "Screening", statuses: ["draft", "screening", "screened_hold"] },
    { key: "ready", label: "Ready", statuses: ["ready_for_interview"] },
    { key: "interview", label: "Interview", statuses: ["assigned", "interview_in_progress"] },
    {
      key: "done",
      label: "Decided",
      statuses: ["selected", "rejected", "hold", "screened_rejected"],
    },
  ];

  const subtitle =
    session.user.role === "admin"
      ? "Full visibility across the team"
      : "Your candidates";

  return (
    <CabinetPage title="Team pipeline" subtitle={subtitle}>
      <div className="grid gap-4 md:grid-cols-4">
        {columns.map((col) => (
          <CaseCard key={col.key} className="p-4">
            <h2 className="case-label">{col.label}</h2>
            <ul className="mt-3 space-y-2">
              {candidates
                .filter((c) => col.statuses.includes(c.status))
                .map((c) => (
                  <li key={c.id}>
                    <Link
                      href={`/evaluate/${c.id}`}
                      className="block rounded-lg bg-[var(--cream)] p-3 no-underline transition-colors hover:bg-[var(--cyan-soft)]"
                    >
                      <div className="flex items-center gap-2">
                        <FaceAvatar name={c.name} size="sm" />
                        <strong className="text-sm text-[var(--ink)]">{c.name}</strong>
                      </div>
                      <Pill variant="neutral" className="mt-2 text-[10px]">
                        {c.status.replace(/_/g, " ")}
                      </Pill>
                    </Link>
                  </li>
                ))}
            </ul>
          </CaseCard>
        ))}
      </div>
    </CabinetPage>
  );
}
