import { requireSession } from "@/lib/auth/rbac";
import { isPanelRole } from "@/lib/auth/capabilities";
import {
  getActivityFeed,
  getCandidatesForUser,
  getStageAssignmentsForUser,
  getStageBookings,
  getUserStats,
} from "@/lib/db/queries";
import {
  InterviewerDashboard,
  TeamDashboard,
} from "@/components/dashboard/RoleDashboard";

export default async function PeoplePage() {
  const session = await requireSession();
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (isPanelRole(session.user.role)) {
    const rows = await getStageAssignmentsForUser(
      session.user.organizationId,
      session.user.id,
    );
    const assignments = rows.map((r) => ({
      id: r.stage.id,
      status: r.stage.status,
      label: r.stage.label,
      dueAt: r.stage.dueAt ? r.stage.dueAt.toISOString() : null,
      handoffNote: r.stage.handoffNote,
      candidate: { id: r.candidate.id, name: r.candidate.name },
    }));
    return <InterviewerDashboard assignments={assignments} today={today} />;
  }

  const [candidates, stats, feed, bookings] = await Promise.all([
    getCandidatesForUser(
      session.user.organizationId,
      session.user.id,
      session.user.role,
    ),
    getUserStats(
      session.user.organizationId,
      session.user.id,
      session.user.role,
    ),
    getActivityFeed(
      session.user.organizationId,
      session.user.role === "admin" ? null : session.user.id,
      8,
    ),
    getStageBookings(session.user.organizationId),
  ]);

  // TAs only see interviews for candidates they own; admins see the whole org.
  const ownedIds = new Set(candidates.map((c) => c.id));
  const scheduled = bookings
    .filter(
      (b) =>
        b.dueAt &&
        b.assigneeId &&
        b.status === "active" &&
        (session.user.role === "admin" || ownedIds.has(b.candidateId)),
    )
    .map((b) => ({
      id: b.id,
      candidateId: b.candidateId,
      candidateName: b.candidateName,
      interviewerName: `${b.assigneeName ?? "—"} · ${b.label}`,
      status: b.status,
      dueAt: (b.dueAt as Date).toISOString(),
    }))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime());

  return (
    <TeamDashboard
      role={session.user.role}
      candidates={candidates}
      stats={stats}
      feed={feed}
      today={today}
      scheduled={scheduled}
    />
  );
}
