import { FaceAvatar } from "@/components/FaceAvatar";
import { Pill } from "@/components/Pill";
import { ButtonLink } from "@/components/Button";
import { CabinetPage, CasePanel, StatBlock } from "@/components/CabinetPage";
import Link from "next/link";
import type { MemberRole } from "@/lib/auth/config";

type CandidateRow = {
  id: string;
  name: string;
  status: string;
};

type ActivityRow = {
  event: { id: string; action: string; createdAt: Date };
  actorName: string | null;
};

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

export function TeamDashboard({
  role,
  candidates,
  stats,
  feed,
  today,
}: {
  role: MemberRole;
  candidates: CandidateRow[];
  stats: {
    inProgress: number;
    selected: number;
    total: number;
  };
  feed: ActivityRow[];
  today: string;
}) {
  const inProgress = candidates.filter((c) =>
    ["screening", "ready_for_interview", "assigned", "draft"].includes(c.status),
  );

  const needsScreening = candidates.filter((c) =>
    ["draft", "screening"].includes(c.status),
  );
  const readyToBook = candidates.filter(
    (c) => c.status === "ready_for_interview",
  );
  const awaitingResult = candidates.filter((c) =>
    ["assigned", "interview_in_progress"].includes(c.status),
  );
  const onHold = candidates.filter((c) =>
    ["hold", "screened_hold"].includes(c.status),
  );

  const actions = [
    {
      key: "screen",
      count: needsScreening.length,
      label: "Awaiting screening",
      hint: "Run AI evaluation & decide",
      href: "/candidates",
      variant: "orange" as const,
      cta: "Screen now",
    },
    {
      key: "book",
      count: readyToBook.length,
      label: "Ready to book",
      hint: "Assign an interviewer & slot",
      href: "/booking",
      variant: "cyan" as const,
      cta: "Book slot",
    },
    {
      key: "await",
      count: awaitingResult.length,
      label: "Awaiting interview result",
      hint: "Follow up with panel",
      href: "/pipeline",
      variant: "neutral" as const,
      cta: "Track",
    },
    {
      key: "hold",
      count: onHold.length,
      label: "On hold",
      hint: "Revisit paused candidates",
      href: "/pipeline",
      variant: "neutral" as const,
      cta: "Review",
    },
  ];

  const title =
    role === "admin" ? "Admin dashboard" : "Talent acquisition dashboard";
  const subtitle =
    role === "admin"
      ? "Organization-wide hiring pipeline and team activity"
      : "Screen candidates, assign interviewers, and track your pipeline";

  return (
    <CabinetPage
      title={title}
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

      <section className="mb-5">
        <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          Action center
        </h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {actions.map((a) => (
            <Link
              key={a.key}
              href={a.href}
              className="case-card group flex flex-col justify-between p-4 no-underline transition-colors hover:border-[var(--cyan)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-serif text-[2.25rem] leading-none">
                  {a.count}
                </span>
                <Pill variant={a.count > 0 ? a.variant : "neutral"}>
                  {a.count > 0 ? "Action" : "Clear"}
                </Pill>
              </div>
              <div className="mt-2">
                <div className="text-[13px] font-bold text-[var(--ink)]">
                  {a.label}
                </div>
                <div className="mt-0.5 text-[11px] text-[var(--ink-faint)]">
                  {a.hint}
                </div>
              </div>
              <span className="mt-3 text-[12px] font-semibold text-[var(--cyan-d)] group-hover:underline">
                {a.cta} →
              </span>
            </Link>
          ))}
        </div>
      </section>

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
          <div className="border-t border-[var(--cream-2)] px-4 py-3 text-right">
            <Link href="/pipeline" className="text-xs font-semibold text-[var(--cyan-d)]">
              Full pipeline →
            </Link>
          </div>
        </CasePanel>
      </div>
    </CabinetPage>
  );
}

export function InterviewerDashboard({
  assignments,
  today,
}: {
  assignments: {
    assignment: { id: string; status: string; handoffNote: string | null };
    candidate: { id: string; name: string };
  }[];
  today: string;
}) {
  const pending = assignments.filter((a) =>
    ["pending", "in_progress"].includes(a.assignment.status),
  );
  const completed = assignments.filter(
    (a) => a.assignment.status === "completed",
  );

  return (
    <CabinetPage
      title="Interview dashboard"
      subtitle={today}
      actions={
        <ButtonLink href="/assignments" className="px-5 py-2 text-[13px]">
          View all assignments →
        </ButtonLink>
      }
    >
      <div className="case-alert mb-5 case-fade-in">
        <div>
          <h2 className="font-serif text-xl font-bold">Your interview queue</h2>
          <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
            Candidates assigned to you for technical interviews
          </p>
        </div>
        <div className="font-serif text-[3.5rem] leading-none text-[var(--cyan-d)] opacity-30">
          {String(pending.length).padStart(2, "0")}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatBlock label="Pending" value={pending.length} icon="◎" />
        <StatBlock label="Completed" value={completed.length} icon="✓" />
        <StatBlock label="Total assigned" value={assignments.length} icon="📋" />
      </div>

      <CasePanel title="Upcoming interviews">
        {assignments.length === 0 ? (
          <p className="p-5 text-sm text-[var(--ink-faint)]">
            No assignments yet. Your TA will assign candidates when ready.
          </p>
        ) : (
          assignments.slice(0, 8).map(({ assignment, candidate }) => (
            <div key={assignment.id} className="case-row">
              <strong>{candidate.name}</strong>
              <span className="truncate text-[var(--ink-soft)]">
                {assignment.handoffNote || "No handoff note"}
              </span>
              <Pill variant="cyan">{assignment.status.replace(/_/g, " ")}</Pill>
              <ButtonLink
                href={`/evaluate/${candidate.id}`}
                variant="ghost"
                className="px-3 py-1 text-[11px]"
              >
                Open
              </ButtonLink>
            </div>
          ))
        )}
      </CasePanel>
    </CabinetPage>
  );
}
