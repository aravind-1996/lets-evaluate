import { requireSession } from "@/lib/auth/rbac";
import { getAssignmentsForUser } from "@/lib/db/queries";
import { FaceAvatar } from "@/components/FaceAvatar";
import Link from "next/link";
import { Pill } from "@/components/Pill";

export default async function AssignmentsPage() {
  const session = await requireSession();
  const rows = await getAssignmentsForUser(
    session.user.organizationId,
    session.user.id,
  );

  return (
    <main className="px-7 py-8">
      <h1 className="font-serif text-2xl font-bold">My assignments</h1>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        Candidates assigned to you for interview
      </p>
      <ul className="mt-8 space-y-3">
        {rows.length === 0 ? (
          <li className="text-sm text-[var(--ink-faint)]">No assignments yet.</li>
        ) : (
          rows.map(({ assignment, candidate }) => (
            <li key={assignment.id}>
              <Link
                href={`/evaluate/${candidate.id}`}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 hover:bg-[var(--cyan-soft)]"
              >
                <FaceAvatar name={candidate.name} size="md" />
                <div className="flex-1">
                  <strong>{candidate.name}</strong>
                  <p className="text-xs text-[var(--ink-faint)]">
                    {assignment.handoffNote || "No handoff note"}
                  </p>
                </div>
                <Pill variant="cyan">{assignment.status}</Pill>
              </Link>
            </li>
          ))
        )}
      </ul>
    </main>
  );
}
