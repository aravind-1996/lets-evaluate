import { requireRole } from "@/lib/auth/rbac";
import { getCandidatesForUser } from "@/lib/db/queries";
import { CabinetPage, CaseCard, StatBlock } from "@/components/CabinetPage";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Pill } from "@/components/Pill";
import { ButtonLink } from "@/components/Button";
import Link from "next/link";

function stagePill(status: string) {
  if (status.includes("screen")) return { label: "Screening", variant: "orange" as const };
  if (status === "ready_for_interview")
    return { label: "Ready", variant: "cyan" as const };
  if (status === "assigned" || status === "interview_in_progress")
    return { label: "Interview", variant: "cyan" as const };
  if (status === "selected") return { label: "Selected", variant: "green" as const };
  if (status === "rejected" || status === "screened_rejected")
    return { label: "Rejected", variant: "neutral" as const };
  if (status.includes("hold")) return { label: "On hold", variant: "neutral" as const };
  return { label: status.replace(/_/g, " "), variant: "neutral" as const };
}

export default async function CandidatesPage() {
  const session = await requireRole(["admin", "ta"]);
  const candidates = await getCandidatesForUser(
    session.user.organizationId,
    session.user.id,
    session.user.role,
  );

  const active = candidates.filter(
    (c) =>
      !["selected", "rejected", "screened_rejected", "interview_complete"].includes(
        c.status,
      ),
  );
  const selected = candidates.filter((c) => c.status === "selected").length;

  return (
    <CabinetPage
      title="Candidate details"
      subtitle="Profiles and AI evaluation reports for every candidate"
      actions={
        <ButtonLink href="/evaluate/new" className="px-5 py-2 text-[13px]">
          + New candidate
        </ButtonLink>
      }
    >
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBlock label="All candidates" value={candidates.length} icon="👥" />
        <StatBlock label="Active" value={active.length} icon="◎" />
        <StatBlock label="Selected" value={selected} icon="✓" />
        <StatBlock
          label="This view"
          value={candidates.length}
          icon="📁"
          className="hidden md:block"
        />
      </div>

      {candidates.length === 0 ? (
        <CaseCard className="p-6 text-sm text-[var(--ink-faint)]">
          No candidates yet. Start by creating a{" "}
          <Link href="/evaluate/new" className="font-semibold text-[var(--cyan-d)]">
            new candidate
          </Link>
          .
        </CaseCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {candidates.map((c) => {
            const pill = stagePill(c.status);
            return (
              <CaseCard key={c.id} hover className="flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <FaceAvatar name={c.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[var(--ink)]">
                      {c.name}
                    </strong>
                    <span className="block truncate text-xs text-[var(--ink-faint)]">
                      {c.email || "No email on file"}
                    </span>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Pill variant={pill.variant}>{pill.label}</Pill>
                  <span className="text-[11px] text-[var(--ink-faint)]">
                    {new Date(c.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <ButtonLink
                    href={`/evaluate/${c.id}`}
                    className="flex-1 px-3 py-2 text-[12px]"
                  >
                    Profile & report
                  </ButtonLink>
                </div>
              </CaseCard>
            );
          })}
        </div>
      )}
    </CabinetPage>
  );
}
