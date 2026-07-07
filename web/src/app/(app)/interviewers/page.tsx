import { requireRole } from "@/lib/auth/rbac";
import { getInterviewers, getOrgAssignments } from "@/lib/db/queries";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Pill } from "@/components/Pill";
import { ButtonLink } from "@/components/Button";

export default async function InterviewersPage() {
  const session = await requireRole(["admin", "ta"]);
  const [interviewers, assignments] = await Promise.all([
    getInterviewers(session.user.organizationId),
    getOrgAssignments(session.user.organizationId),
  ]);

  const loadFor = (userId: string) => {
    const mine = assignments.filter((a) => a.assigneeId === userId);
    return {
      pending: mine.filter((a) =>
        ["pending", "in_progress"].includes(a.assignment.status),
      ).length,
      completed: mine.filter((a) => a.assignment.status === "completed").length,
      total: mine.length,
    };
  };

  return (
    <CabinetPage
      title="Interviewer details"
      subtitle="Panel members, their expertise, and current interview load"
      actions={
        <ButtonLink href="/booking" className="px-5 py-2 text-[13px]">
          Book a slot →
        </ButtonLink>
      }
    >
      {interviewers.length === 0 ? (
        <CaseCard className="p-6 text-sm text-[var(--ink-faint)]">
          No interviewers found in your organization yet.
        </CaseCard>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {interviewers.map((iv) => {
            const load = loadFor(iv.id);
            return (
              <CaseCard key={iv.id} className="flex flex-col p-5">
                <div className="flex items-center gap-3">
                  <FaceAvatar name={iv.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <strong className="block truncate text-[var(--ink)]">
                      {iv.name}
                    </strong>
                    <span className="block truncate text-xs text-[var(--ink-faint)]">
                      {iv.email}
                    </span>
                  </div>
                  <Pill variant="neutral" className="capitalize">
                    {iv.role.replace(/_/g, " ")}
                  </Pill>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-[var(--cream)] py-2">
                    <div className="font-serif text-xl">{load.pending}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                      Pending
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--cream)] py-2">
                    <div className="font-serif text-xl">{load.completed}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                      Done
                    </div>
                  </div>
                  <div className="rounded-lg bg-[var(--cream)] py-2">
                    <div className="font-serif text-xl">{load.total}</div>
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
                      Total
                    </div>
                  </div>
                </div>
              </CaseCard>
            );
          })}
        </div>
      )}
    </CabinetPage>
  );
}
