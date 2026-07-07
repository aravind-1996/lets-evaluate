import { requireSession } from "@/lib/auth/rbac";
import {
  getActivityFeed,
  getCandidatesForUser,
  getUserStats,
} from "@/lib/db/queries";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Pill } from "@/components/Pill";
import { ButtonLink } from "@/components/Button";
import { CabinetPage, CasePanel, StatBlock } from "@/components/CabinetPage";
import Link from "next/link";

function stagePill(status: string) {
  if (status.includes("screen")) return { label: "Analysis", variant: "orange" as const };
  if (status === "assigned" || status === "interview_in_progress")
    return { label: "Interview", variant: "cyan" as const };
  if (status === "selected") return { label: "Selected", variant: "green" as const };
  if (status === "hold" || status === "screened_hold")
    return { label: "Setup", variant: "neutral" as const };
  if (status.includes("question")) return { label: "Questions", variant: "cyan" as const };
  return { label: status.replace(/_/g, " "), variant: "neutral" as const };
}

export default async function PeoplePage() {
  const session = await requireSession();
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
    getActivityFeed(session.user.organizationId, 8),
  ]);

  const inProgress = candidates.filter((c) =>
    ["screening", "ready_for_interview", "assigned", "draft"].includes(c.status),
  );

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <CabinetPage
      title="Case dashboard"
      subtitle={today}
      actions={
        <ButtonLink href="/evaluate/new" className="px-5 py-2 text-[13px]">
          + New case file
        </ButtonLink>
      }
    >
      {inProgress.length > 0 && (
        <div className="case-alert mb-5 case-fade-in">
          <div>
            <h2 className="font-serif text-xl font-bold">
              {inProgress.length} case file{inProgress.length !== 1 ? "s" : ""} in progress
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
              Pick up where you left off or open a new evaluation
            </p>
          </div>
          <div className="font-serif text-[3.5rem] leading-none text-[var(--cyan-d)] opacity-30">
            {String(inProgress.length).padStart(2, "0")}
          </div>
        </div>
      )}

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatBlock label="In progress" value={stats.inProgress} icon="📋" />
        <StatBlock label="Selected" value={stats.selected} icon="✓" />
        <StatBlock label="All cases" value={stats.total} icon="📁" />
        <StatBlock
          label="Open now"
          value={inProgress.length}
          icon="◎"
          className="hidden md:block"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
        <CasePanel title="Open case files">
          {candidates.length === 0 ? (
            <p className="p-5 text-sm text-[var(--ink-faint)]">No case files yet.</p>
          ) : (
            candidates.slice(0, 8).map((c) => {
              const pill = stagePill(c.status);
              return (
                <div key={c.id} className="case-row">
                  <strong>{c.name}</strong>
                  <span className="text-[var(--ink-soft)] capitalize">
                    {c.status.replace(/_/g, " ")}
                  </span>
                  <Pill variant={pill.variant}>{pill.label}</Pill>
                  <ButtonLink
                    href={`/evaluate/${c.id}`}
                    variant="ghost"
                    className="px-3 py-1 text-[11px]"
                  >
                    Open
                  </ButtonLink>
                </div>
              );
            })
          )}
        </CasePanel>

        <CasePanel title="Recent activity">
          <div className="px-3 py-2">
            {feed.length === 0 ? (
              <p className="p-3 text-sm text-[var(--ink-faint)]">No activity yet.</p>
            ) : (
              feed.map(({ event, actorName }) => (
                <div
                  key={event.id}
                  className="flex gap-3 border-b border-dashed border-[var(--cream-2)] px-2 py-3.5 last:border-none"
                >
                  <FaceAvatar name={actorName ?? "System"} size="sm" />
                  <div className="min-w-0 flex-1 text-[13px]">
                    <strong>{actorName ?? "System"}</strong>{" "}
                    <span className="text-[var(--ink-soft)]">{event.action}</span>
                    <span className="mt-0.5 block text-[11px] text-[var(--ink-faint)]">
                      {new Date(event.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {(session.user.role === "admin" || session.user.role === "ta") && (
            <div className="border-t border-[var(--cream-2)] px-4 py-3 text-right">
              <Link href="/pipeline" className="text-xs font-semibold text-[var(--cyan-d)]">
                Full pipeline →
              </Link>
            </div>
          )}
        </CasePanel>
      </div>
    </CabinetPage>
  );
}
