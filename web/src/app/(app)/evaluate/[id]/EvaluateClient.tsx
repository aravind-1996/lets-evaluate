"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Pill } from "@/components/Pill";
import { FieldSelect, FieldTextarea } from "@/components/FormField";
import { cn } from "@/lib/utils";
import type { ResumeMetrics } from "@/lib/ai";

type Metrics = Partial<ResumeMetrics>;

type Question = { question?: string; text?: string; category?: string };

type Ratings = Record<string, { recruiter?: string; interviewer?: string }>;

const STEPS = ["Setup", "AI Analysis", "Questions", "Verdict"] as const;

export function EvaluateClient({
  candidateId,
  candidateName,
  role,
  projectName,
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
  projectName?: string;
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
    initialMetrics?.tech_match_score
      ? initialStandardQuestions?.length
        ? 4
        : 2
      : 1,
  );
  const [metrics, setMetrics] = useState<Metrics | undefined>(initialMetrics);
  const [standardQuestions, setStandardQuestions] = useState<Question[]>(
    initialStandardQuestions ?? [],
  );
  const [resumeQuestions, setResumeQuestions] = useState<Question[]>(
    initialResumeQuestions ?? [],
  );
  const [comments, setComments] = useState("");
  const [analysisModel, setAnalysisModel] = useState<string | undefined>();
  const [reviewComments, setReviewComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewers, setInterviewers] = useState<{ id: string; name: string }[]>([]);
  const [assignTo, setAssignTo] = useState("");
  const [ratings, setRatings] = useState<Ratings>({});
  const [savedAt, setSavedAt] = useState<number | null>(null);

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
          if (d?.data?.comments) setComments(d.data.comments as string);
          if (d?.data?.ratings) setRatings(d.data.ratings as Ratings);
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
        data: { comments, ratings, ...extra },
      }),
    });
    setSavedAt(Date.now());
  }

  async function runAnalyze() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "analyze" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Analysis failed. Please try again.");
      return;
    }
    if (data.metrics) {
      setMetrics(data.metrics as Metrics);
      if (data.model) setAnalysisModel(data.model as string);
      setStep(2);
      await saveDraft(2);
    }
  }

  async function generateQuestions() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/candidates/${candidateId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "questions" }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not generate questions.");
      return;
    }
    if (data.standardQuestions) {
      setStandardQuestions(data.standardQuestions);
      setResumeQuestions(data.resumeQuestions ?? []);
      setStep(3);
      await saveDraft(3);
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

  const caseId = candidateId.slice(0, 8).toUpperCase();
  const score = metrics?.tech_match_score;
  const hasResume = Boolean(resumeFilename);
  const analyzed = Boolean(metrics?.tech_match_score);
  const questionsReady = standardQuestions.length > 0;

  const isStepComplete = (n: number) =>
    n === 1 ? analyzed : n === 2 || n === 3 ? questionsReady : false;
  const maxReachableStep: 1 | 2 | 3 | 4 = analyzed
    ? questionsReady
      ? 4
      : 2
    : 1;
  const canContinue = step < 4 && isStepComplete(step);

  function goToStep(n: 1 | 2 | 3 | 4) {
    if (n > maxReachableStep) return;
    setStep(n);
    saveDraft(n);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <div className="flex items-center justify-between gap-3 bg-[var(--navy)] px-5 py-3.5 text-white md:px-6">
        <div className="min-w-0">
          <div className="truncate font-serif text-[1.05rem] leading-tight text-white">
            {candidateName}
          </div>
          <div className="truncate text-[11px] text-white/50">{role}</div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="case-label hidden text-white/50 sm:inline">
            Case #{caseId} · Draft
          </span>
          <button
            type="button"
            onClick={() => saveDraft(step)}
            className="rounded-lg border border-white/30 bg-white/10 px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-white/20"
          >
            {savedAt ? "Saved ✓" : "Save draft"}
          </button>
        </div>
      </div>

      {canScreen && (
        <div className="flex border-b border-[var(--cream-2)]">
          {STEPS.map((label, i) => {
            const n = (i + 1) as 1 | 2 | 3 | 4;
            const done = isStepComplete(n) && step !== n;
            const state = step === n ? "on" : done ? "done" : "idle";
            const reachable = n <= maxReachableStep;
            return (
              <button
                key={label}
                type="button"
                onClick={() => goToStep(n)}
                disabled={!reachable}
                aria-current={step === n ? "step" : undefined}
                title={reachable ? `Go to ${label}` : "Complete the previous step first"}
                className={cn(
                  "eval-step",
                  state === "done" && "done",
                  state === "on" && "on",
                )}
              >
                <span className="num">{done ? "✓" : n}</span>
                {label}
              </button>
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
          {projectName && <MarginField label="Project" value={projectName} />}
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

          {error && (
            <div className="case-card mb-4 border-[var(--orange)] bg-[var(--orange-soft)] p-3 text-sm text-[var(--orange)]">
              {error}
            </div>
          )}

          {canScreen && step === 1 && (
            <section className="case-card p-5 case-fade-in">
              <h2 className="font-serif text-xl font-bold">Evidence & analysis</h2>
              <p className="mt-1 text-[13px] text-[var(--ink-faint)]">
                We read the uploaded resume automatically — no copy/paste needed.
              </p>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-4">
                <div className="grid size-10 shrink-0 place-items-center rounded-lg bg-[var(--ink)] text-white">
                  📄
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-bold">
                    {resumeFilename ?? "No resume uploaded"}
                  </div>
                  <div className="text-xs text-[var(--ink-faint)]">
                    {hasResume
                      ? "Resume on file — ready to analyze"
                      : "Upload a resume on the candidate to enable analysis"}
                  </div>
                </div>
                {hasResume && <Pill variant="green">Ready</Pill>}
              </div>
              <Button
                className="mt-4"
                onClick={runAnalyze}
                disabled={loading || !hasResume}
              >
                {loading
                  ? "Analyzing…"
                  : analyzed
                    ? "Re-evaluate the profile →"
                    : "Analyze the candidate profile →"}
              </Button>
            </section>
          )}

          {canScreen && step === 2 && (
            <section className="case-fade-in space-y-4">
              {!metrics ? (
                <div className="case-card p-5">
                  <h2 className="font-serif text-xl font-bold">AI Analysis</h2>
                  <Button
                    className="mt-4"
                    onClick={runAnalyze}
                    disabled={loading || !hasResume}
                  >
                    {loading ? "Analyzing…" : "Evaluate the profile →"}
                  </Button>
                </div>
              ) : (
                <>
                  <AnalysisReport
                    metrics={metrics}
                    candidateName={candidateName}
                    role={role}
                    projectName={projectName}
                    ratings={ratings}
                    onRatingsChange={(next) => {
                      setRatings(next);
                      saveDraft(2, { ratings: next });
                    }}
                  />
                  <div className="case-card p-5">
                    <Button onClick={generateQuestions} disabled={loading}>
                      {loading ? "Generating…" : "Continue to questions →"}
                    </Button>
                  </div>
                </>
              )}
            </section>
          )}

          {canScreen && step === 3 && metrics && (
            <section className="case-card p-5 case-fade-in">
              <h2 className="font-serif text-xl font-bold">Interview questions</h2>
              {standardQuestions.length === 0 ? (
                <Button className="mt-4" onClick={generateQuestions} disabled={loading}>
                  {loading ? "Generating…" : "Generate questions"}
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
            Analysis: {(analysisModel ?? "gpt-4o").toUpperCase()}
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
            onClick={() => goToStep(Math.max(1, step - 1) as 1 | 2 | 3 | 4)}
            disabled={step === 1}
          >
            ← Back
          </Button>
          <Button
            className="px-4 py-2 text-sm"
            onClick={() => goToStep(Math.min(4, step + 1) as 1 | 2 | 3 | 4)}
            disabled={!canContinue}
            title={
              canContinue
                ? undefined
                : step === 1
                  ? "Analyze the profile to continue"
                  : "Complete this step to continue"
            }
          >
            Continue →
          </Button>
        </footer>
      )}
    </div>
  );
}

/* ─────────────────────────── Analysis report ─────────────────────────── */

function AnalysisReport({
  metrics,
  candidateName,
  role,
  projectName,
  ratings,
  onRatingsChange,
}: {
  metrics: Metrics;
  candidateName: string;
  role: string;
  projectName?: string;
  ratings: Ratings;
  onRatingsChange: (next: Ratings) => void;
}) {
  const techList = (metrics.tech_comparison ?? []).map((t) => t.technology);
  const clarifications = metrics.clarifications ?? [];
  const roleLabel = projectName ? `${role} — ${projectName}` : role;

  return (
    <div className="space-y-4">
      {/* Top tiles */}
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCell
          label="Match score"
          value={`${metrics.tech_match_score ?? 0}%`}
          accent
        />
        <MetricCell
          label="Relevant experience"
          value={
            metrics.total_experience_calculated ||
            metrics.total_experience_mentioned ||
            "Not specified"
          }
        />
        <MetricCell
          label="Recommendation"
          value={metrics.recommendation ?? "—"}
          accent
        />
      </div>

      {/* Current / last employer for cross-check */}
      {(metrics.current_employer ||
        metrics.current_role ||
        metrics.current_tenure) && (
        <div className="case-card p-5">
          <SectionTitle>
            {metrics.is_currently_employed
              ? "Current employment"
              : "Most recent employment"}
          </SectionTitle>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">
            Use this to cross-check with the candidate during the call.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <KeyVal label="Employer" value={metrics.current_employer || "—"} />
            <KeyVal label="Role" value={metrics.current_role || "—"} />
            <KeyVal label="Tenure" value={metrics.current_tenure || "—"} />
          </div>
        </div>
      )}

      {/* Domain expertise */}
      {metrics.domain_expertise && metrics.domain_expertise.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Domain expertise</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {metrics.domain_expertise.map((d) => (
              <Pill key={d} variant="neutral">
                {d}
              </Pill>
            ))}
          </div>
        </div>
      )}

      {/* Tech stack comparison */}
      {metrics.tech_comparison && metrics.tech_comparison.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Tech stack comparison</SectionTitle>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--cream-2)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-left">
                  <Th>Technology</Th>
                  <Th>Result</Th>
                </tr>
              </thead>
              <tbody>
                {metrics.tech_comparison.map((t) => (
                  <tr key={t.technology} className="border-t border-[var(--cream-2)]">
                    <Td>{t.technology}</Td>
                    <Td>
                      <StatusPill status={t.status} />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Clarifications required */}
      {clarifications.length > 0 && (
        <div className="case-card border-[var(--orange)] bg-[var(--orange-soft)] p-5">
          <SectionTitle>Clarification required</SectionTitle>
          <p className="mt-1 text-xs text-[var(--ink-soft)]">
            These skills are mentioned generically. Ask the candidate to
            elaborate, then send the message manually via email for now.
          </p>
          <div className="mt-3 space-y-3">
            {clarifications.map((c) => (
              <ClarificationCard
                key={c.technology}
                candidateName={candidateName}
                technology={c.technology}
                reason={c.reason}
              />
            ))}
          </div>
        </div>
      )}

      {/* Tech experience years */}
      {metrics.tech_experience && metrics.tech_experience.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Technology experience</SectionTitle>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">
            Where the candidate has spent the most time.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--cream-2)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-left">
                  <Th>Technology</Th>
                  <Th>From</Th>
                  <Th>To</Th>
                  <Th>Total years</Th>
                </tr>
              </thead>
              <tbody>
                {metrics.tech_experience.map((t) => (
                  <tr key={t.technology} className="border-t border-[var(--cream-2)]">
                    <Td>{t.technology}</Td>
                    <Td>{t.first_year || "—"}</Td>
                    <Td>{t.last_year || "—"}</Td>
                    <Td>{t.total_years || "—"}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Career history */}
      {metrics.career_history && metrics.career_history.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Career timeline</SectionTitle>
          <ol className="mt-3 space-y-3">
            {metrics.career_history.map((c, i) => (
              <li
                key={`${c.company}-${i}`}
                className="rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold">
                    {c.title || "Role"} · {c.company || "Company"}
                  </span>
                  {c.is_current && <Pill variant="green">Current</Pill>}
                </div>
                <div className="mt-1 text-xs text-[var(--ink-faint)]">
                  {[c.start, c.end].filter(Boolean).join(" – ") || "Dates not specified"}
                  {c.duration ? ` · ${c.duration}` : ""}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Certifications */}
      {metrics.certifications && metrics.certifications.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Certifications</SectionTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {metrics.certifications.map((c) => (
              <li
                key={c}
                className="rounded-lg bg-[var(--cream)] px-3 py-2"
              >
                {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Rate yourself grid */}
      {techList.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Self / panel rating</SectionTitle>
          <p className="mt-1 text-xs text-[var(--ink-faint)]">
            Optional. Capture a 1–5 rating per technology from the recruiter and
            the interviewer.
          </p>
          <div className="mt-3 overflow-hidden rounded-xl border border-[var(--cream-2)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-left">
                  <Th>Technology</Th>
                  <Th>Recruiter</Th>
                  <Th>Interviewer</Th>
                </tr>
              </thead>
              <tbody>
                {techList.map((tech) => (
                  <tr key={tech} className="border-t border-[var(--cream-2)]">
                    <Td>{tech}</Td>
                    <Td>
                      <RatingSelect
                        value={ratings[tech]?.recruiter ?? ""}
                        onChange={(v) =>
                          onRatingsChange({
                            ...ratings,
                            [tech]: { ...ratings[tech], recruiter: v },
                          })
                        }
                      />
                    </Td>
                    <Td>
                      <RatingSelect
                        value={ratings[tech]?.interviewer ?? ""}
                        onChange={(v) =>
                          onRatingsChange({
                            ...ratings,
                            [tech]: { ...ratings[tech], interviewer: v },
                          })
                        }
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Strengths & weaknesses */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="case-card p-5">
          <SectionTitle>Strengths</SectionTitle>
          {metrics.strengths && metrics.strengths.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {metrics.strengths.map((s) => (
                <li key={s} className="flex gap-2">
                  <span className="text-[var(--green)]">+</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-faint)]">None noted.</p>
          )}
        </div>
        <div className="case-card p-5">
          <SectionTitle>Weaknesses / gaps</SectionTitle>
          {metrics.concerns && metrics.concerns.length > 0 ? (
            <ul className="mt-3 space-y-2 text-sm">
              {metrics.concerns.map((c) => (
                <li key={c} className="flex gap-2">
                  <span className="text-[var(--orange)]">–</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--ink-faint)]">None noted.</p>
          )}
        </div>
      </div>

      {/* Suitability */}
      <div className="case-card border-[var(--cyan)] bg-[var(--cyan-soft)] p-5">
        <SectionTitle>Suitability for {roleLabel}</SectionTitle>
        <div className="mt-2 flex items-center gap-2">
          <Pill
            variant={suitabilityVariant(metrics.suitability?.verdict)}
          >
            {metrics.suitability?.verdict || "Review required"}
          </Pill>
        </div>
        <p className="mt-3 text-sm leading-relaxed">
          {metrics.suitability?.description || metrics.summary || "—"}
        </p>
      </div>

      {/* Project suggestions */}
      {metrics.project_suggestions && metrics.project_suggestions.length > 0 && (
        <div className="case-card p-5">
          <SectionTitle>Other matching projects</SectionTitle>
          <ul className="mt-3 space-y-2 text-sm">
            {metrics.project_suggestions.map((p, i) => (
              <li
                key={`${p.project}-${i}`}
                className="rounded-lg bg-[var(--cream)] px-3 py-2"
              >
                <span className="font-bold">{p.project}</span>
                {p.reason ? ` — ${p.reason}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClarificationCard({
  candidateName,
  technology,
  reason,
}: {
  candidateName: string;
  technology: string;
  reason: string;
}) {
  const firstName = candidateName.split(" ")[0] || "there";
  const defaultMessage = `Hi ${firstName},\n\nCould you please elaborate on the specific services and features you have worked on under ${technology} in real-time, production projects? A short note on the project context, your exact responsibilities, and how you applied ${technology} hands-on would help us evaluate your experience accurately.\n\nThank you!`;
  const [message, setMessage] = useState(defaultMessage);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="rounded-xl border border-[var(--cream-2)] bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold">{technology}</span>
        <Pill variant="orange">Clarify</Pill>
      </div>
      {reason && (
        <p className="mt-1 text-xs text-[var(--ink-faint)]">{reason}</p>
      )}
      <FieldTextarea
        className="mt-3 text-sm"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button
        type="button"
        onClick={copy}
        className="mt-2 rounded-lg border border-[var(--cream-2)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--ink)] transition-colors hover:border-[var(--cyan)] hover:bg-[var(--cream)]"
      >
        {copied ? "Copied ✓" : "Copy message"}
      </button>
    </div>
  );
}

function RatingSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="case-input px-2 py-1 text-sm"
    >
      <option value="">—</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={String(n)}>
          {n}
        </option>
      ))}
    </select>
  );
}

function StatusPill({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s.startsWith("match")) return <Pill variant="green">Matched</Pill>;
  if (s.startsWith("clarif")) return <Pill variant="orange">Clarification</Pill>;
  return <Pill variant="neutral">Unmatched</Pill>;
}

function suitabilityVariant(verdict?: string): "green" | "orange" | "neutral" {
  const v = (verdict ?? "").toLowerCase();
  if (v.startsWith("suitable")) return "green";
  if (v.startsWith("partial")) return "orange";
  if (v.startsWith("not")) return "neutral";
  return "neutral";
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-serif text-lg font-bold">{children}</h3>;
}

function KeyVal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--cream-2)] bg-[var(--cream)] p-3">
      <div className="case-label">{label}</div>
      <div className="mt-1 text-sm font-semibold">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2 text-[10px] font-bold uppercase tracking-wide text-[var(--ink-faint)]">
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td className="px-3 py-2 align-middle">{children}</td>;
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
