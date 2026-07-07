"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { FieldTextarea } from "@/components/FormField";
import { cn } from "@/lib/utils";
import type { ResumeMetrics } from "@/lib/ai";
import { AnalysisReport } from "./EvaluateClient";

type Metrics = Partial<ResumeMetrics>;

/** Category metadata is duplicated here (as plain data) so this client bundle
 * never imports the server-only AI module. Ids must match the server list. */
const CATEGORIES: { id: string; label: string; hint: string; code: boolean }[] = [
  { id: "Resume based", label: "Resume based", hint: "Verify resume claims", code: false },
  { id: "Backend", label: "Backend", hint: "APIs, data, concurrency", code: false },
  { id: "Frontend", label: "Frontend", hint: "UI, state, performance", code: false },
  { id: "Architecture", label: "Architecture", hint: "Design trade-offs", code: false },
  { id: "Scenario based", label: "Scenario based", hint: "Situational judgement", code: false },
  { id: "Code error spotting", label: "Find errors in code", hint: "Buggy snippets", code: true },
  { id: "Refactoring", label: "Refactoring techniques", hint: "Improve snippets", code: true },
];

const SATISFACTION = ["", "Satisfied", "Not satisfied"];
const SEVERITIES = ["Easy", "Medium", "Hard"];

type WorkItem = {
  id: string;
  category: string;
  question: string;
  code: string;
  difficulty: string;
  expected_answer_hints: string;
  satisfaction: string;
  notes: string;
  savedToLibrary: boolean;
};

type RoleOption = { id: string; name: string };

let seq = 0;
const nextId = () => `q_${Date.now()}_${seq++}`;

export function InterviewWorkspace({
  stageId,
  stageLabel,
  candidateName,
  role,
  projectName,
  metrics,
  onDone,
}: {
  stageId: string;
  stageLabel: string;
  candidateName: string;
  role: string;
  projectName?: string;
  metrics?: Metrics;
  onDone: () => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [items, setItems] = useState<WorkItem[]>([]);
  const [ratings, setRatings] = useState<
    Record<string, { recruiter?: string; interviewer?: string }>
  >({});
  const [genCategory, setGenCategory] = useState<string>(CATEGORIES[0].id);
  const [genCount, setGenCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [justification, setJustification] = useState("");
  const [decision, setDecision] = useState<"yes" | "no" | "">("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleOption[]>([]);

  useEffect(() => {
    fetch("/api/roles")
      .then((r) => (r.ok ? r.json() : []))
      .then((rows: RoleOption[]) =>
        setRoles(
          Array.isArray(rows)
            ? rows.map((r) => ({ id: r.id, name: r.name }))
            : [],
        ),
      )
      .catch(() => {});
  }, []);

  async function generate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/stages/${stageId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: genCategory, count: genCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error ?? "Could not generate questions.");
        return;
      }
      const generated = (data.questions ?? []) as {
        question: string;
        category: string;
        code?: string;
        difficulty?: string;
        expected_answer_hints?: string;
      }[];
      setItems((prev) => [
        ...prev,
        ...generated.map((q) => ({
          id: nextId(),
          category: q.category || genCategory,
          question: q.question,
          code: q.code ?? "",
          difficulty: q.difficulty || "Medium",
          expected_answer_hints: q.expected_answer_hints ?? "",
          satisfaction: "",
          notes: "",
          savedToLibrary: false,
        })),
      ]);
    } finally {
      setGenerating(false);
    }
  }

  function update(id: string, patch: Partial<WorkItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function submit() {
    if (!decision) {
      setError("Select whether the candidate should proceed.");
      return;
    }
    if (!justification.trim()) {
      setError("Please add your justification before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        decision,
        comments: justification,
        questions: items.map((it) => ({
          category: it.category,
          question: it.question,
          code: it.code,
          difficulty: it.difficulty,
          satisfaction: it.satisfaction,
          notes: it.notes,
        })),
      }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data?.error ?? "Could not submit your evaluation.");
      return;
    }
    onDone();
  }

  const steps: { n: 1 | 2 | 3; label: string }[] = [
    { n: 1, label: "AI Analysis" },
    { n: 2, label: "Questions" },
    { n: 3, label: "Final" },
  ];

  return (
    <div className="case-fade-in">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 className="font-serif text-xl font-bold">Your round: {stageLabel}</h2>
        <Pill variant="orange">Awaiting your evaluation</Pill>
      </div>

      {/* Step bar */}
      <div className="mb-5 flex flex-wrap overflow-hidden rounded-xl border border-[var(--cream-2)]">
        {steps.map((s) => {
          const state = step === s.n ? "on" : step > s.n ? "done" : "idle";
          return (
            <button
              key={s.n}
              type="button"
              onClick={() => setStep(s.n)}
              className={cn(
                "eval-step flex-1",
                state === "done" && "done",
                state === "on" && "on",
              )}
              aria-current={state === "on" ? "step" : undefined}
            >
              <span className="num">{state === "done" ? "✓" : s.n}</span>
              {s.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="case-card mb-4 border-[var(--orange)] bg-[var(--orange-soft)] p-3 text-sm text-[var(--orange)]">
          {error}
        </div>
      )}

      {/* Step 1: AI Analysis */}
      {step === 1 && (
        <section className="space-y-4">
          {metrics && metrics.tech_match_score != null ? (
            <AnalysisReport
              metrics={metrics}
              candidateName={candidateName}
              role={role}
              projectName={projectName}
              ratings={ratings}
              onRatingsChange={setRatings}
            />
          ) : (
            <div className="case-card p-5 text-sm text-[var(--ink-faint)]">
              No AI analysis is available for this candidate yet.
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)}>Continue to questions →</Button>
          </div>
        </section>
      )}

      {/* Step 2: Questions */}
      {step === 2 && (
        <section className="space-y-4">
          <div className="case-card p-5">
            <h3 className="font-serif text-lg font-bold">Generate questions</h3>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Pick a category and generate tailored questions. Add the ones you
              like to your library and rate the candidate&apos;s answers.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setGenCategory(c.id)}
                  title={c.hint}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors",
                    genCategory === c.id
                      ? "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan-d)]"
                      : "border-[var(--cream-2)] bg-white text-[var(--ink)] hover:border-[var(--cyan)]",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <label className="text-xs font-semibold text-[var(--ink-faint)]">
                How many
                <select
                  value={genCount}
                  onChange={(e) => setGenCount(Number(e.target.value))}
                  className="case-input ml-2 px-2 py-1 text-sm"
                >
                  {[3, 5, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <Button onClick={generate} disabled={generating}>
                {generating ? "Generating…" : "Generate questions →"}
              </Button>
            </div>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-[var(--ink-faint)]">
              No questions yet — generate some above.
            </p>
          ) : (
            <div className="space-y-3">
              {items.map((it, i) => (
                <QuestionCard
                  key={it.id}
                  index={i + 1}
                  item={it}
                  roles={roles}
                  onChange={(patch) => update(it.id, patch)}
                  onRemove={() => remove(it.id)}
                />
              ))}
            </div>
          )}

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)}>Continue to final →</Button>
          </div>
        </section>
      )}

      {/* Step 3: Final */}
      {step === 3 && (
        <section className="space-y-4">
          <div className="case-card p-5">
            <h3 className="font-serif text-lg font-bold">Final decision</h3>
            <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
              Provide your justification and choose whether the candidate should
              proceed. Submitting generates a PDF evaluation report and sends it,
              with your comments, to the recruiter.
            </p>

            <div className="mt-4 rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-3 text-sm">
              <div className="case-label">Assessment summary</div>
              <div className="mt-1">
                {items.length} question{items.length !== 1 ? "s" : ""} ·{" "}
                {items.filter((i) => i.satisfaction === "Satisfied").length}{" "}
                satisfied ·{" "}
                {items.filter((i) => i.satisfaction === "Not satisfied").length}{" "}
                not satisfied
              </div>
            </div>

            <FieldTextarea
              className="mt-4"
              rows={6}
              placeholder="Justification — strengths, concerns, and the reasoning behind your decision…"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />

            <div className="mt-4">
              <span className="case-label">Recommend next process</span>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setDecision("yes")}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-bold transition-colors",
                    decision === "yes"
                      ? "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]"
                      : "border-[var(--cream-2)] bg-white hover:border-[var(--green)]",
                  )}
                >
                  Proceed to next round
                </button>
                <button
                  type="button"
                  onClick={() => setDecision("no")}
                  className={cn(
                    "rounded-xl border px-4 py-2 text-sm font-bold transition-colors",
                    decision === "no"
                      ? "border-[var(--orange)] bg-[var(--orange-soft)] text-[var(--orange)]"
                      : "border-[var(--cream-2)] bg-white hover:border-[var(--orange)]",
                  )}
                >
                  Do not proceed
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Submitting…" : "Generate report & submit →"}
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  item,
  roles,
  onChange,
  onRemove,
}: {
  index: number;
  item: WorkItem;
  roles: RoleOption[];
  onChange: (patch: Partial<WorkItem>) => void;
  onRemove: () => void;
}) {
  const [libOpen, setLibOpen] = useState(false);
  const [visibility, setVisibility] = useState<"org" | "private">("org");
  const [libRoleId, setLibRoleId] = useState("");
  const [saving, setSaving] = useState(false);

  async function saveToLibrary() {
    setSaving(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: item.question,
          category: item.category,
          difficulty: item.difficulty,
          roleId: libRoleId || undefined,
          code: item.code,
          visibility,
        }),
      });
      if (res.ok) {
        onChange({ savedToLibrary: true });
        setLibOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="case-card p-4">
      <div className="flex items-start gap-3">
        <span className="font-serif text-lg text-[var(--ink-faint)]">{index}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Pill variant="neutral" className="text-[10px]">
              {item.category}
            </Pill>
            <Pill variant="cyan" className="text-[10px]">
              {item.difficulty}
            </Pill>
          </div>
          <p className="mt-2 text-sm font-semibold">{item.question}</p>
          {item.code && (
            <pre className="mt-2 overflow-auto rounded-lg border border-[var(--cream-2)] bg-[var(--cream)] p-3 text-xs leading-relaxed">
              <code>{item.code}</code>
            </pre>
          )}
          {item.expected_answer_hints && (
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              <strong>Hints:</strong> {item.expected_answer_hints}
            </p>
          )}

          {/* Assessment */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="case-label">Assessment</span>
            <select
              value={item.satisfaction}
              onChange={(e) => onChange({ satisfaction: e.target.value })}
              className="case-input px-2 py-1 text-sm"
            >
              {SATISFACTION.map((s) => (
                <option key={s} value={s}>
                  {s || "—"}
                </option>
              ))}
            </select>
          </div>
          <FieldTextarea
            className="mt-2 text-sm"
            rows={2}
            placeholder="Notes on the candidate's answer…"
            value={item.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />

          {/* Library */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.savedToLibrary ? (
              <Pill variant="green" className="text-[10px]">
                Saved to library ✓
              </Pill>
            ) : (
              <button
                type="button"
                onClick={() => setLibOpen((v) => !v)}
                className="text-xs font-semibold text-[var(--cyan-d)] hover:underline"
              >
                {libOpen ? "Cancel" : "+ Add to question library"}
              </button>
            )}
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-semibold text-[var(--ink-faint)] hover:text-[var(--orange)]"
            >
              Remove
            </button>
          </div>

          {libOpen && !item.savedToLibrary && (
            <div className="mt-2 grid gap-2 rounded-lg border border-[var(--cream-2)] bg-[var(--cream)] p-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-[var(--ink-faint)]">
                Share with
                <select
                  value={visibility}
                  onChange={(e) =>
                    setVisibility(e.target.value as "org" | "private")
                  }
                  className="case-input mt-1 w-full px-2 py-1 text-sm"
                >
                  <option value="org">All users</option>
                  <option value="private">Only me</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--ink-faint)]">
                Role
                <select
                  value={libRoleId}
                  onChange={(e) => setLibRoleId(e.target.value)}
                  className="case-input mt-1 w-full px-2 py-1 text-sm"
                >
                  <option value="">Any role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold text-[var(--ink-faint)]">
                Severity
                <select
                  value={item.difficulty}
                  onChange={(e) => onChange({ difficulty: e.target.value })}
                  className="case-input mt-1 w-full px-2 py-1 text-sm"
                >
                  {SEVERITIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <div className="sm:col-span-3">
                <Button
                  className="px-4 py-2 text-sm"
                  onClick={saveToLibrary}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save to library"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
