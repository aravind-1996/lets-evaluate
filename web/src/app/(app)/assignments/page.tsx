import { requireSession } from "@/lib/auth/rbac";
import { getStageAssignmentsForUser } from "@/lib/db/queries";
import { FaceAvatar } from "@/components/FaceAvatar";
import Link from "next/link";
import { Pill } from "@/components/Pill";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";

export default async function AssignmentsPage() {
  const session = await requireSession();
  const rows = await getStageAssignmentsForUser(
    session.user.organizationId,
    session.user.id,
  );

  const pending = rows.filter((r) => r.stage.status === "active");
  const done = rows.filter((r) => r.stage.status !== "active");

  return (
    <CabinetPage
      title="My assignments"
      subtitle="Interview rounds assigned to you"
    >
      <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
        To review ({pending.length})
      </h2>
      <ul className="space-y-3">
        {pending.length === 0 ? (
          <li className="text-sm text-[var(--ink-faint)]">
            Nothing awaiting your decision.
          </li>
        ) : (
          pending.map(({ stage, candidate }) => (
            <li key={stage.id}>
              <Link href={`/evaluate/${candidate.id}`} className="block no-underline">
                <CaseCard
                  hover
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--cyan-soft)]"
                >
                  <FaceAvatar name={candidate.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <strong className="text-[var(--ink)]">{candidate.name}</strong>
                    <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                      {stage.label}
                      {stage.dueAt
                        ? ` · ${new Date(stage.dueAt).toLocaleString("en-GB", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}`
                        : ""}
                    </p>
                    {stage.handoffNote && (
                      <p className="mt-0.5 truncate text-xs text-[var(--ink-soft)]">
                        {stage.handoffNote}
                      </p>
                    )}
                  </div>
                  <Pill variant="cyan">Review</Pill>
                </CaseCard>
              </Link>
            </li>
          ))
        )}
      </ul>

      {done.length > 0 && (
        <>
          <h2 className="mb-2 mt-6 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
            Completed ({done.length})
          </h2>
          <ul className="space-y-3">
            {done.map(({ stage, candidate }) => (
              <li key={stage.id}>
                <Link href={`/evaluate/${candidate.id}`} className="block no-underline">
                  <CaseCard className="flex items-center gap-4 p-4">
                    <FaceAvatar name={candidate.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <strong className="text-[var(--ink)]">{candidate.name}</strong>
                      <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                        {stage.label}
                      </p>
                    </div>
                    <Pill
                      variant={
                        stage.decision === "yes"
                          ? "green"
                          : stage.decision === "no"
                            ? "orange"
                            : "neutral"
                      }
                    >
                      {stage.decision === "yes"
                        ? "Passed"
                        : stage.decision === "no"
                          ? "Not selected"
                          : stage.status}
                    </Pill>
                  </CaseCard>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </CabinetPage>
  );
}
