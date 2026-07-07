import { requireSession } from "@/lib/auth/rbac";
import {
  getActivityFeed,
  getAssignmentsForUser,
  getCandidatesForUser,
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

  if (session.user.role === "interviewer") {
    const assignments = await getAssignmentsForUser(
      session.user.organizationId,
      session.user.id,
    );
    return (
      <InterviewerDashboard assignments={assignments} today={today} />
    );
  }

  const [candidates, stats, feed] = await Promise.all([
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
  ]);

  return (
    <TeamDashboard
      role={session.user.role}
      candidates={candidates}
      stats={stats}
      feed={feed}
      today={today}
    />
  );
}
