import { requireSession } from "@/lib/auth/rbac";
import { getCandidatesForUser } from "@/lib/db/queries";
import { PolaroidCard } from "@/components/PolaroidCard";
import { CabinetPage } from "@/components/CabinetPage";

export default async function ArchivePage() {
  const session = await requireSession();
  const all = await getCandidatesForUser(
    session.user.organizationId,
    session.user.id,
    session.user.role,
  );
  const archived = all.filter((c) =>
    ["selected", "rejected", "hold", "screened_rejected", "interview_complete"].includes(
      c.status,
    ),
  );

  function decisionFor(status: string) {
    if (status === "selected") return "selected" as const;
    if (status === "rejected" || status === "screened_rejected") return "rejected" as const;
    if (status.includes("hold")) return "hold" as const;
    return "neutral" as const;
  }

  return (
    <CabinetPage
      title="Closed case files"
      subtitle={`${archived.length} verdicts on record · PDF export available`}
      bodyClassName="space-y-5"
    >
      <div className="case-banner">
        <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-[var(--cyan)] text-2xl">
          ▤
        </div>
        <div>
          <h2 className="font-serif text-xl font-bold">Evaluation archive</h2>
          <p className="mt-1 text-[13px] text-white/65">
            Every verdict recorded with a complete audit trail
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {archived.length === 0 ? (
          <p className="text-sm text-[var(--ink-faint)]">No archived cases yet.</p>
        ) : (
          archived.map((c) => (
            <PolaroidCard
              key={c.id}
              name={c.name}
              meta={c.status.replace(/_/g, " ")}
              decision={decisionFor(c.status)}
              date={new Date(c.updatedAt).toLocaleDateString()}
            />
          ))
        )}
      </div>
    </CabinetPage>
  );
}
