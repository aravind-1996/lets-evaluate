"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { EvalChat } from "@/components/EvalChat";
import { Pill } from "@/components/Pill";
import { FieldSelect, FieldTextarea } from "@/components/FormField";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

type Metrics = {
  tech_match_score?: number;
  recommendation?: string;
  strengths?: string[];
  concerns?: string[];
};

type Question = { question?: string; text?: string; category?: string };

const STEPS = ["Setup", "AI Analysis", "Questions", "Verdict"] as const;

export function EvaluateClient({
  candidateId,
  candidateName,
  role,
  resumeFilename,
  canScreen,
  canReview,
  initialMetrics,
  initialStandardQuestions,
  initialResumeQuestions,
  screeningComments,
}: {
  candidateId: string;
  candidateName: string;
  role: string;
  resumeFilename?: string;
  canScreen: boolean;
  canReview: boolean;
  initialMetrics?: Metrics;
  initialStandardQuestions?: Question[];
  initialResumeQuestions?: Question[];
  screeningComments?: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(
    initialMetrics?.tech_match_score ? (initialStandardQuestions?.length ? 4 : 3) : 1,
  );
  const [metrics, setMetrics] = useState<Metrics | undefined>(initialMetrics);
  const [resumeText, setResumeText] = useState("");
  const [standardQuestions, setStandardQuestions] = useState<Question[]>(
    initialStandardQuestions ?? [],
  );
  const [resumeQuestions, setResumeQuestions] = useState<Question[]>(
    initialResumeQuestions ?? [],
  );
  const [comments, setComments] = useState("");
  const [reviewComments, setReviewComments] = useState("");
  const [messages, setMessages] = useState<{ role: "ai" | "you"; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [interviewers, setInterviewers] = useState<{ id: string; name: string }[]>([]);
  const [assignTo, setAssignTo] = useState("");

  useEffect(() => {
    if (canScreen) {
      fetch("/api/interviewers")
        .then((r) => r.json())
        .then(setInterviewers)
        .catch(() => {});
      fetch(`/api/drafts?candidateId=${candidateId}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.step) setStep(d.step as 1 | 2 | 3 | 4);
          if (d?.data?.resumeText) setResumeText(d.data.resumeText as string);
          if (d?.data?.comments) setComments(d.data.comments as string);
        })
        .catch(() => {});
    }
  }, [canScreen, candidateId]);

  async function saveDraft(nextStep: number, extra: Record<string, unknown> = {}) {
    await fetch("/api/drafts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidateId,
        step: nextStep,
        data: { resumeText, comments, ...extra },
      }),
    });
  }

  async function runAnalyze() {
    setLoading(true);
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyze", resumeText }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.metrics) {
      setMetrics(data.metrics);
      setMessages([
        {
          role: "ai",
          text: `Tech match: ${data.metrics.tech_match_score}%. Recommendation: ${data.metrics.recommendation}. Strengths: ${(data.metrics.strengths ?? []).join(", ")}. Gaps: ${(data.metrics.concerns ?? []).join(", ")}`,
        },
      ]);
      setStep(3);
      await saveDraft(3);
    }
  }

  async function generateQuestions() {
    setLoading(true);
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "questions", resumeText }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.standardQuestions) {
      setStandardQuestions(data.standardQuestions);
      setResumeQuestions(data.resumeQuestions ?? []);
      setStep(4);
      await saveDraft(4);
    }
  }

  async function decide(decision: "proceed" | "hold" | "reject") {
    await fetch(`/api/candidates/${candidateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "decide", decision, comments }),
    });
    if (decision === "proceed" && assignTo) {
      await fetch(`/api/assignments/${candidateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: assignTo }),
      });
    }
    await fetch(`/api/drafts?id=${candidateId}`, { method: "DELETE" }).catch(() => {});
    router.push("/people");
    router.refresh();
  }

  async function submitReview(decision: "selected" | "rejected" | "hold") {
    await fetch(`/api/assignments/${candidateId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comments: reviewComments, decision }),
    });
    router.push("/assignments");
    router.refresh();
  }

  function qText(q: Question) {
    return q.question ?? q.text ?? "";
  }

  const caseId = candidateId.slice(0, 8).toUpperCase();
  const score = metrics?.tech_match_score;

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex items-center justify-between bg-[var(--navy)] px-5 py-3.5 text-white md:px-6">
        <Logo href="/people" light />
        <span className="case-label text-white/50">
          Case #{caseId} · Draft
        </span>
        <Button
          variant="ghost"
          className="border-white/30 px-4 py-1.5 text-xs text-white hover:bg-white/10"
          onClick={() => saveDraft(step)}
        >
          Save draft
        </Button>
      </div>

      {canScreen && (
        <div className="flex border-b border-[var(--cream-2)]">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const state =
              step === n ? "on" : step > n ? "done" : "idle";
            return (
              <div
                key={label}
                className={cn(
                  "eval-step",
                  state === "done" && "done",
                  state === "on" && "on",
                )}
              >
                <span className="num">{state === "done" ? "✓" : n}</span>
                {label}
              </div>
            );
          })}
        </div>
      )}

      <div className="grid flex-1 md:grid-cols-[180px_1fr_200px]">
        <aside className="hidden border-r border-[var(--cream-2)] bg-[var(--cream-2)] p-4 md:block">
          <Pill variant="cyan" className="mb-4 text-[10px]">
            In review
          </Pill>
          <MarginField label="Case ID" value={caseId} />
          <MarginField label="Role" value={role} />
          <MarginField label="Evidence" value={resumeFilename ?? "—"} />
          <MarginField
            label="Opened"
            value={new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          />
        </aside>

        <main className="overflow-auto p-5 md:p-7">
          {canScreen && screeningComments && (
            <div className="case-card mb-4 border-[var(--cyan)] bg-[var(--cyan-soft)] p-4 text-sm">
              <strong>TA screening notes:</strong> {screeningComments}
            </div>
          )}

          <div className="mb-5 flex items-center gap-4 rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-4">
            <div className="font-serif grid size-14 place-items-center rounded-xl border border-[var(--cream-2)] bg-[var(--ink)] text-lg text-white">
              {candidateName
                .split(" ")
                .map((p) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="text-lg font-extrabold">{candidateName}</div>
              <div className="text-[13px] text-[var(--ink-faint)]">{role}</div>
            </div>
            {metrics?.recommendation && (
              <Pill variant="green">{metrics.recommendation}</Pill>
            )}
          </div>

          {canScreen && step === 1 && (
            <section className="case-card p-5 case-fade-in">
              <h2 className="font-serif text-xl font-bold">Upload evidence</h2>
              <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
                Paste resume text for AI analysis
              </p>
              {resumeFilename && (
                <p className="mt-2 text-xs text-[var(--ink-faint)]">
                  Uploaded: {resumeFilename}
                </p>
              )}
              <FieldTextarea
                className="mt-4"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste resume text…"
              />
              <Button
                className="mt-4"
                onClick={() => {
                  setStep(2);
                  saveDraft(2);
                }}
                disabled={!resumeText}
              >
                Continue to analysis →
              </Button>
            </section>
          )}

          {canScreen && step === 2 && (
            <section className="case-card p-5 case-fade-in">
              <h2 className="font-serif text-xl font-bold">AI Analysis</h2>
              <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
                Review the evidence before generating interview questions
              </p>
              <EvalChat messages={messages} className="mt-4" />
              {!metrics && (
                <Button
                  className="mt-4"
                  onClick={runAnalyze}
                  disabled={loading || !resumeText}
                >
                  {loading ? "Analyzing…" : "Run AI analysis"}
                </Button>
              )}
              {metrics && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <MetricCell label="Tech match" value={`${metrics.tech_match_score}%`} accent />
                  <MetricCell label="Recommendation" value={metrics.recommendation ?? "—"} accent />
                  <MetricCell
                    label="Strengths"
                    value={String((metrics.strengths ?? []).length)}
                  />
                </div>
              )}
              {metrics && (
                <Button className="mt-4" onClick={generateQuestions} disabled={loading}>
                  {loading ? "Generating…" : "Continue to questions →"}
                </Button>
              )}
            </section>
          )}

          {canScreen && step === 3 && metrics && (
            <section className="case-card p-5 case-fade-in">
              <h2 className="font-serif text-xl font-bold">Interview questions</h2>
              {standardQuestions.length === 0 ? (
                <Button className="mt-4" onClick={generateQuestions} disabled={loading}>
                  Generate questions
                </Button>
              ) : (
                <>
                  <QuestionList title="Standard" items={standardQuestions} variant="cream" />
                  {resumeQuestions.length > 0 && (
                    <QuestionList title="Resume-specific" items={resumeQuestions} variant="cyan" />
                  )}
                  <Button className="mt-4" onClick={() => setStep(4)}>
                    Continue to verdict →
                  </Button>
                </>
              )}
            </section>
          )}

          {canScreen && step === 4 && (
            <section className="case-card p-5 case-fade-in">
              <h2 className="font-serif text-xl font-bold">Record verdict</h2>
              <FieldTextarea
                className="mt-4"
                placeholder="Your screening notes…"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
              {interviewers.length > 0 && (
                <FieldSelect
                  className="mt-3"
                  value={assignTo}
                  onChange={(e) => setAssignTo(e.target.value)}
                >
                  <option value="">Assign interviewer (if proceed)</option>
                  {interviewers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </FieldSelect>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => decide("proceed")}>Proceed</Button>
                <Button variant="ghost" onClick={() => decide("hold")}>
                  Hold
                </Button>
                <Button variant="ghost" onClick={() => decide("reject")}>
                  Reject
                </Button>
              </div>
            </section>
          )}

          {canReview && (
            <section className="case-card mt-4 border-[var(--orange)] bg-[var(--orange-soft)] p-5">
              <h2 className="font-serif text-xl font-bold">Interview review</h2>
              {metrics && (
                <p className="mt-2 text-sm">
                  TA score: {metrics.tech_match_score}% — read-only screening summary
                </p>
              )}
              <FieldTextarea
                className="mt-3"
                value={reviewComments}
                onChange={(e) => setReviewComments(e.target.value)}
                placeholder="Interview notes and recommendation…"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <Button onClick={() => submitReview("selected")}>Selected</Button>
                <Button variant="ghost" onClick={() => submitReview("hold")}>
                  Hold
                </Button>
                <Button variant="ghost" onClick={() => submitReview("rejected")}>
                  Reject
                </Button>
              </div>
            </section>
          )}
        </main>

        <aside className="hidden flex-col border-l border-[var(--cream-2)] bg-[var(--navy)] p-4 text-white md:flex">
          {score != null ? (
            <>
              <div className="mx-auto grid size-[100px] place-items-center rounded-full border-[3px] border-[var(--cyan)] font-serif text-3xl text-[var(--cyan)]">
                {score}%
              </div>
              <p className="case-label mt-3 text-center text-white/50">Tech match</p>
              {metrics?.strengths && metrics.strengths.length > 0 && (
                <div className="mt-5 w-full space-y-2">
                  {metrics.strengths.slice(0, 4).map((s) => (
                    <ScoreBar key={s} label={s} width={85} />
                  ))}
                  {(metrics.concerns ?? []).slice(0, 2).map((c) => (
                    <ScoreBar key={c} label={c} width={45} warn />
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="mt-8 text-center text-xs text-white/40">
              Run analysis to see scores
            </p>
          )}
          <p className="mt-auto border-t border-white/15 pt-4 text-center text-[10px] leading-relaxed text-white/40">
            GPT-4o-mini
            <br />
            Human review required
          </p>
        </aside>
      </div>

      {canScreen && (
        <footer className="flex items-center justify-between border-t border-[var(--cream-2)] bg-[var(--cream)] px-5 py-3.5 md:px-7">
          <Button
            variant="ghost"
            className="px-4 py-2 text-sm"
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
            disabled={step === 1}
          >
            ← Back
          </Button>
          {step < 4 && step !== 2 && (
            <Button className="px-4 py-2 text-sm" onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3 | 4)}>
              Continue →
            </Button>
          )}
        </footer>
      )}
    </div>
  );
}

function MarginField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-4">
      <span className="case-label block">{label}</span>
      <span className="text-xs font-semibold">{value}</span>
    </div>
  );
}

function MetricCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-4 text-center">
      <div className="case-label">{label}</div>
      <div
        className={cn(
          "font-serif mt-1 text-2xl",
          accent && "text-[var(--green)]",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function QuestionList({
  title,
  items,
  variant,
}: {
  title: string;
  items: Question[];
  variant: "cream" | "cyan";
}) {
  return (
    <>
      <p className="case-label mt-4">{title}</p>
      <ul className="mt-2 space-y-2 text-sm">
        {items.map((q, i) => (
          <li
            key={i}
            className={cn(
              "rounded-xl p-3",
              variant === "cyan" ? "bg-[var(--cyan-soft)]" : "bg-[var(--cream)]",
            )}
          >
            {q.question ?? q.text ?? ""}
          </li>
        ))}
      </ul>
    </>
  );
}

function ScoreBar({
  label,
  width,
  warn,
}: {
  label: string;
  width: number;
  warn?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-[9px] uppercase tracking-wide text-white/50">
        {label.slice(0, 20)}
      </div>
      <div className="h-1.5 bg-white/15">
        <div
          className={cn("h-full", warn ? "bg-[var(--orange)]" : "bg-[var(--cyan)]")}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}
