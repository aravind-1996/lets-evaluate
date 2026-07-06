import { requireSession } from "@/lib/auth/rbac";
import {
  getActivityFeed,
  getCandidatesForUser,
  getUserStats,
} from "@/lib/db/queries";
import { FaceAvatar } from "@/components/FaceAvatar";
import { PersonTile } from "@/components/PersonTile";
import { Pill } from "@/components/Pill";
import Link from "next/link";
import { ButtonLink } from "@/components/Button";

function stageForStatus(status: string) {
  if (status.includes("screen")) return { label: "Screening", color: "s2" as const };
  if (status === "assigned" || status === "interview_in_progress")
    return { label: "Interview", color: "s3" as const };
  if (status === "selected") return { label: "Selected", color: "s4" as const };
  if (status === "hold" || status === "screened_hold")
    return { label: "Hold", color: "s1" as const };
  return { label: status, color: "s2" as const };
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

  const needsAttention = candidates.find((c) =>
    ["screening", "ready_for_interview", "assigned"].includes(c.status),
  );

  return (
    <main>
      <header className="flex items-center justify-between px-7 py-5">
        <div>
          <h1 className="font-serif text-2xl font-bold">
            Hey {session.user.name.split(" ")[0]}
          </h1>
          <p className="text-sm text-[var(--ink-faint)]">
            {stats.inProgress} people need attention today
          </p>
        </div>
        <FaceAvatar name={session.user.name} size="md" />
      </header>

      {needsAttention && (
        <div className="mx-7 mb-6 flex items-center gap-5 rounded-3xl rounded-br-lg bg-gradient-to-br from-[var(--orange-soft)] to-[var(--cream)] p-6">
          <FaceAvatar name={needsAttention.name} size="lg" />
          <div className="flex-1">
            <h3 className="font-serif text-lg font-bold">
              {needsAttention.name} is waiting
            </h3>
            <p className="text-sm text-[var(--ink-soft)]">
              Status: {needsAttention.status.replace(/_/g, " ")}
            </p>
          </div>
          <ButtonLink href={`/evaluate/${needsAttention.id}`} className="shrink-0 text-sm">
            Continue →
          </ButtonLink>
        </div>
      )}

      <div className="mx-7 mb-8 grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white p-5 text-center">
          <div className="font-serif text-3xl font-extrabold text-[var(--cyan-d)]">
            {stats.inProgress}
          </div>
          <div className="text-[11px] font-semibold text-[var(--ink-faint)]">In progress</div>
        </div>
        <div className="rounded-2xl bg-white p-5 text-center">
          <div className="font-serif text-3xl font-extrabold text-[var(--green)]">
            {stats.selected}
          </div>
          <div className="text-[11px] font-semibold text-[var(--ink-faint)]">Selected</div>
        </div>
        <div className="rounded-2xl bg-white p-5 text-center">
          <div className="font-serif text-3xl font-extrabold">{stats.total}</div>
          <div className="text-[11px] font-semibold text-[var(--ink-faint)]">All time</div>
        </div>
      </div>

      <section className="px-7 pb-8">
        <h2 className="mb-4 text-[13px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
          People in your pipeline
        </h2>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {candidates.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)]">No candidates yet.</p>
          ) : (
            candidates.map((c) => {
              const st = stageForStatus(c.status);
              return (
                <Link key={c.id} href={`/evaluate/${c.id}`}>
                  <PersonTile
                    name={c.name}
                    subtitle={c.status.replace(/_/g, " ")}
                    stageLabel={st.label}
                    stageColor={st.color}
                  />
                </Link>
              );
            })
          )}
        </div>
      </section>

      <section className="px-7 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
            What your team did
          </h2>
          {(session.user.role === "admin" || session.user.role === "ta") && (
            <Link href="/pipeline" className="text-xs font-semibold text-[var(--cyan-d)]">
              Full pipeline →
            </Link>
          )}
        </div>
        <ul className="space-y-3">
          {feed.map(({ event, actorName }) => (
            <li
              key={event.id}
              className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3.5"
            >
              <FaceAvatar name={actorName ?? "System"} size="sm" />
              <div className="flex-1 text-sm">
                <strong>{actorName ?? "System"}</strong>{" "}
                <span className="text-[var(--ink-soft)]">{event.action}</span>
              </div>
              <Pill variant="neutral" className="text-[10px]">
                {new Date(event.createdAt).toLocaleDateString()}
              </Pill>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
