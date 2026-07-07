import { requireRole } from "@/lib/auth/rbac";
import {
  getBookableCandidates,
  getInterviewers,
  getOrgAssignments,
} from "@/lib/db/queries";
import { CabinetPage } from "@/components/CabinetPage";
import { BookingClient } from "./BookingClient";

export default async function BookingPage() {
  const session = await requireRole(["admin", "ta"]);
  const [bookable, interviewers, assignments] = await Promise.all([
    getBookableCandidates(session.user.organizationId),
    getInterviewers(session.user.organizationId),
    getOrgAssignments(session.user.organizationId),
  ]);

  const candidates = bookable.map((row) => {
    const metrics = (row.metrics ?? {}) as Record<string, unknown>;
    const score = metrics.tech_match_score;
    return {
      id: row.candidate.id,
      name: row.candidate.name,
      email: row.candidate.email ?? "",
      status: row.candidate.status,
      techMatchScore: typeof score === "number" ? score : null,
      recommendation:
        typeof metrics.recommendation === "string"
          ? (metrics.recommendation as string)
          : null,
      summary:
        typeof metrics.summary === "string" ? (metrics.summary as string) : null,
    };
  });

  const upcoming = assignments
    .filter((a) => ["pending", "in_progress"].includes(a.assignment.status))
    .map((a) => ({
      id: a.assignment.id,
      candidateName: a.candidate.name,
      interviewer: a.assigneeName,
      status: a.assignment.status,
      dueAt: a.assignment.dueAt ? a.assignment.dueAt.toISOString() : null,
      handoffNote: a.assignment.handoffNote ?? "",
    }));

  return (
    <CabinetPage
      title="Booking"
      subtitle="Assign screened candidates and their AI evaluation report to an interviewer"
    >
      <BookingClient
        candidates={candidates}
        interviewers={interviewers}
        upcoming={upcoming}
      />
    </CabinetPage>
  );
}
