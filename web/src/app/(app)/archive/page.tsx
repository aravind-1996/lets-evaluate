import { requireSession } from "@/lib/auth/rbac";
import { getCandidatesForUser } from "@/lib/db/queries";
import { PolaroidCard } from "@/components/PolaroidCard";

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
    <main className="px-7 py-8">
      <h1 className="font-serif text-3xl font-extrabold">People you&apos;ve evaluated</h1>
      <p className="mt-1 text-sm text-[var(--ink-faint)]">
        {archived.length} stories · archived with care
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {archived.map((c) => (
          <PolaroidCard
            key={c.id}
            name={c.name}
            meta={c.status.replace(/_/g, " ")}
            decision={decisionFor(c.status)}
            date={new Date(c.updatedAt).toLocaleDateString()}
          />
        ))}
      </div>
    </main>
  );
}
