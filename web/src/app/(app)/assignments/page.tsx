import { requireSession } from "@/lib/auth/rbac";
import { getAssignmentsForUser } from "@/lib/db/queries";
import { FaceAvatar } from "@/components/FaceAvatar";
import Link from "next/link";
import { Pill } from "@/components/Pill";
import { CabinetPage, CaseCard } from "@/components/CabinetPage";

export default async function AssignmentsPage() {
  const session = await requireSession();
  const rows = await getAssignmentsForUser(
    session.user.organizationId,
    session.user.id,
  );

  return (
    <CabinetPage
      title="My assignments"
      subtitle="Candidates assigned to you for interview"
    >
      <ul className="space-y-3">
        {rows.length === 0 ? (
          <li className="text-sm text-[var(--ink-faint)]">No assignments yet.</li>
        ) : (
          rows.map(({ assignment, candidate }) => (
            <li key={assignment.id}>
              <Link href={`/evaluate/${candidate.id}`} className="block no-underline">
                <CaseCard
                  hover
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-[var(--cyan-soft)]"
                >
                  <FaceAvatar name={candidate.name} size="md" />
                  <div className="flex-1">
                    <strong className="text-[var(--ink)]">{candidate.name}</strong>
                    <p className="mt-0.5 text-xs text-[var(--ink-faint)]">
                      {assignment.handoffNote || "No handoff note"}
                    </p>
                  </div>
                  <Pill variant="cyan">{assignment.status}</Pill>
                </CaseCard>
              </Link>
            </li>
          ))
        )}
      </ul>
    </CabinetPage>
  );
}
