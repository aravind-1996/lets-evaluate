"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CaseCard } from "@/components/CabinetPage";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Pill } from "@/components/Pill";
import { Button } from "@/components/Button";
import { FieldInput, FieldSelect, FieldTextarea } from "@/components/FormField";

type Candidate = {
  id: string;
  name: string;
  email: string;
  status: string;
  techMatchScore: number | null;
  recommendation: string | null;
  summary: string | null;
};

type Interviewer = { id: string; name: string; email: string };

type Upcoming = {
  id: string;
  candidateName: string;
  interviewer: string;
  status: string;
  dueAt: string | null;
  handoffNote: string;
};

export function BookingClient({
  candidates,
  interviewers,
  upcoming,
}: {
  candidates: Candidate[];
  interviewers: Interviewer[];
  upcoming: Upcoming[];
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [interviewerId, setInterviewerId] = useState("");
  const [slot, setSlot] = useState("");
  const [note, setNote] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function openForm(candidateId: string) {
    setActiveId((prev) => (prev === candidateId ? null : candidateId));
    setInterviewerId("");
    setSlot("");
    setNote("");
    setError(null);
    setBookingId(null);
  }

  async function book(candidateId: string) {
    if (bookingId) return;
    if (!interviewerId) {
      setError("Select an interviewer first.");
      setBookingId(null);
      return;
    }
    setBookingId(candidateId);
    setError(null);
    try {
      const res = await fetch(`/api/assignments/${candidateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedToId: interviewerId,
          handoffNote: note,
          dueAt: slot ? new Date(slot).toISOString() : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not book this slot.");
        return;
      }
      setActiveId(null);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBookingId(null);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          Ready for interview ({candidates.length})
        </h2>
        {candidates.length === 0 ? (
          <CaseCard className="p-6 text-sm text-[var(--ink-faint)]">
            No candidates are ready for booking yet. Candidates appear here once TA
            screening marks them as{" "}
            <span className="font-semibold">ready for interview</span>.
          </CaseCard>
        ) : (
          <ul className="space-y-3">
            {candidates.map((c) => (
              <li key={c.id}>
                <CaseCard className="p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <FaceAvatar name={c.name} size="md" />
                    <div className="min-w-0 flex-1">
                      <strong className="block truncate text-[var(--ink)]">
                        {c.name}
                      </strong>
                      <span className="block truncate text-xs text-[var(--ink-faint)]">
                        {c.email || "No email on file"}
                      </span>
                    </div>
                    {c.techMatchScore !== null && (
                      <Pill
                        variant={
                          c.techMatchScore >= 70
                            ? "green"
                            : c.techMatchScore >= 40
                              ? "orange"
                              : "neutral"
                        }
                      >
                        {c.techMatchScore}% match
                      </Pill>
                    )}
                  </div>

                  {c.summary && (
                    <p className="mt-3 line-clamp-2 text-[13px] text-[var(--ink-soft)]">
                      {c.summary}
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <Link
                      href={`/evaluate/${c.id}`}
                      className="rounded-lg border border-[var(--cream-2)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--ink)] no-underline transition-colors hover:border-[var(--cyan)]"
                    >
                      View evaluation report
                    </Link>
                    <Button
                      className="px-4 py-2 text-[12px]"
                      onClick={() => openForm(c.id)}
                    >
                      {activeId === c.id ? "Cancel" : "Book slot"}
                    </Button>
                  </div>

                  {activeId === c.id && (
                    <div className="mt-4 rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-4">
                      <label className="mb-1 block text-xs font-bold text-[var(--ink-soft)]">
                        Interviewer
                      </label>
                      <FieldSelect
                        value={interviewerId}
                        onChange={(e) => setInterviewerId(e.target.value)}
                      >
                        <option value="">Select interviewer…</option>
                        {interviewers.map((iv) => (
                          <option key={iv.id} value={iv.id}>
                            {iv.name} ({iv.email})
                          </option>
                        ))}
                      </FieldSelect>

                      <label className="mb-1 mt-3 block text-xs font-bold text-[var(--ink-soft)]">
                        Slot (date &amp; time)
                      </label>
                      <FieldInput
                        type="datetime-local"
                        value={slot}
                        onChange={(e) => setSlot(e.target.value)}
                      />

                      <label className="mb-1 mt-3 block text-xs font-bold text-[var(--ink-soft)]">
                        Handoff note
                      </label>
                      <FieldTextarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Context for the interviewer (focus areas, concerns from the report)…"
                      />

                      {error && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          {error}
                        </p>
                      )}

                      <Button
                        className="mt-3 px-5 py-2 text-[13px]"
                        onClick={() => book(c.id)}
                        disabled={bookingId === c.id}
                      >
                        {bookingId === c.id ? "Booking…" : "Confirm booking"}
                      </Button>
                    </div>
                  )}
                </CaseCard>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--ink-faint)]">
          Upcoming interviews ({upcoming.length})
        </h2>
        {upcoming.length === 0 ? (
          <CaseCard className="p-6 text-sm text-[var(--ink-faint)]">
            No booked interviews yet.
          </CaseCard>
        ) : (
          <ul className="space-y-3">
            {upcoming.map((u) => (
              <li key={u.id}>
                <CaseCard className="p-4">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-[var(--ink)]">{u.candidateName}</strong>
                    <Pill variant="cyan" className="capitalize">
                      {u.status.replace(/_/g, " ")}
                    </Pill>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-faint)]">
                    with {u.interviewer}
                  </p>
                  {u.dueAt && (
                    <p className="mt-1 text-xs font-semibold text-[var(--cyan-d)]">
                      {new Date(u.dueAt).toLocaleString()}
                    </p>
                  )}
                  {u.handoffNote && (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--ink-soft)]">
                      {u.handoffNote}
                    </p>
                  )}
                </CaseCard>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
