"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FaceAvatar } from "@/components/FaceAvatar";
import { Button } from "@/components/Button";
import { EvalChat } from "@/components/EvalChat";

type Metrics = {
  tech_match_score?: number;
  recommendation?: string;
  strengths?: string[];
  concerns?: string[];
};

type Question = { question?: string; text?: string; category?: string };

const STEPS = ["Resume", "AI analysis", "Questions", "Decision"] as const;

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
  const [messages, setMessages] = useState<
    { role: "ai" | "you"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [interviewers, setInterviewers] = useState<
    { id: string; name: string }[]
  >([]);
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
    await fetch(`/api/drafts?id=${candidateId}`, { method: "DELETE" }).catch(
      () => {},
    );
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

  return (
    <main className="flex min-h-[calc(100vh-6rem)] flex-col">
      <header className="flex items-center gap-4 border-b border-[var(--cream-2)] bg-white px-7 py-5">
        <FaceAvatar name={candidateName} size="lg" />
        <div className="flex-1">
          <h1 className="font-serif text-xl font-bold">{candidateName}</h1>
          <p className="text-sm text-[var(--ink-faint)]">{role}</p>
        </div>
        {canScreen && (
          <div className="flex gap-1">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                  step === i + 1
                    ? "bg-[var(--cyan)] text-white"
                    : step > i + 1
                      ? "bg-[var(--green-soft)] text-[var(--green)]"
                      : "bg-[var(--cream)] text-[var(--ink-faint)]"
                }`}
              >
                {i + 1}
              </span>
            ))}
          </div>
        )}
      </header>

      {canScreen && screeningComments && (
        <div className="mx-7 mt-4 rounded-2xl bg-[var(--cyan-soft)] p-4 text-sm">
          <strong>TA screening notes:</strong> {screeningComments}
        </div>
      )}

      <div className="flex-1 space-y-4 overflow-auto px-7 py-6">
        {canScreen && step === 1 && (
          <div className="rounded-2xl bg-white p-4">
            <h3 className="font-bold">Step 1 — Resume</h3>
            {resumeFilename && (
              <p className="mt-1 text-xs text-[var(--ink-faint)]">
                Uploaded: {resumeFilename}
              </p>
            )}
            <label className="mt-3 block text-xs font-bold uppercase text-[var(--ink-faint)]">
              Resume text for AI
            </label>
            <textarea
              className="mt-2 min-h-[120px] w-full rounded-xl border p-3 text-sm"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste resume text or upload when creating candidate…"
            />
            <Button
              className="mt-3"
              onClick={() => {
                setStep(2);
                saveDraft(2);
              }}
              disabled={!resumeText}
            >
              Continue to analysis
            </Button>
          </div>
        )}

        {canScreen && step === 2 && (
          <div className="rounded-2xl bg-white p-4">
            <h3 className="font-bold">Step 2 — AI analysis</h3>
            <EvalChat messages={messages} />
            {!metrics && (
              <Button
                className="mt-3"
                onClick={runAnalyze}
                disabled={loading || !resumeText}
              >
                {loading ? "Analyzing…" : "Run AI analysis"}
              </Button>
            )}
            {metrics && (
              <div className="mt-4 rounded-2xl bg-[var(--green-soft)] p-5">
                <div className="font-serif text-5xl font-extrabold text-[var(--green)]">
                  {metrics.tech_match_score}%
                </div>
                <p className="text-sm font-semibold">
                  Tech match · {metrics.recommendation}
                </p>
                <Button className="mt-3" onClick={generateQuestions} disabled={loading}>
                  {loading ? "Generating…" : "Generate interview questions"}
                </Button>
              </div>
            )}
          </div>
        )}

        {canScreen && step === 3 && metrics && (
          <div className="rounded-2xl bg-white p-4">
            <h3 className="font-bold">Step 3 — Questions</h3>
            {standardQuestions.length === 0 ? (
              <Button onClick={generateQuestions} disabled={loading}>
                Generate questions
              </Button>
            ) : (
              <>
                <p className="mt-2 text-xs font-bold uppercase text-[var(--ink-faint)]">
                  Standard
                </p>
                <ul className="mt-2 space-y-2 text-sm">
                  {standardQuestions.map((q, i) => (
                    <li key={i} className="rounded-xl bg-[var(--cream)] p-3">
                      {qText(q)}
                    </li>
                  ))}
                </ul>
                {resumeQuestions.length > 0 && (
                  <>
                    <p className="mt-4 text-xs font-bold uppercase text-[var(--ink-faint)]">
                      Resume-specific
                    </p>
                    <ul className="mt-2 space-y-2 text-sm">
                      {resumeQuestions.map((q, i) => (
                        <li key={i} className="rounded-xl bg-[var(--cyan-soft)] p-3">
                          {qText(q)}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
                <Button className="mt-4" onClick={() => setStep(4)}>
                  Continue to decision
                </Button>
              </>
            )}
          </div>
        )}

        {canScreen && step === 4 && (
          <div className="rounded-2xl bg-white p-4">
            <h3 className="font-bold">Step 4 — TA decision</h3>
            <textarea
              className="mt-3 min-h-[80px] w-full rounded-xl border p-3 text-sm"
              placeholder="Your screening notes…"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
            />
            {interviewers.length > 0 && (
              <select
                className="mt-2 w-full rounded-xl border p-2 text-sm"
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
              >
                <option value="">Assign interviewer (if proceed)</option>
                {interviewers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            )}
            <div className="mt-3 flex gap-2">
              <Button onClick={() => decide("proceed")}>Proceed</Button>
              <Button variant="ghost" onClick={() => decide("hold")}>
                Hold
              </Button>
              <Button variant="ghost" onClick={() => decide("reject")}>
                Reject
              </Button>
            </div>
          </div>
        )}

        {canReview && (
          <div className="rounded-2xl bg-[var(--orange-soft)] p-4">
            <h3 className="font-bold">Your interview review</h3>
            {metrics && (
              <p className="mt-2 text-sm">
                TA score: {metrics.tech_match_score}% — read-only screening summary
              </p>
            )}
            <textarea
              className="mt-2 min-h-[100px] w-full rounded-xl border p-3 text-sm"
              value={reviewComments}
              onChange={(e) => setReviewComments(e.target.value)}
              placeholder="Interview notes and recommendation…"
            />
            <div className="mt-3 flex gap-2">
              <Button onClick={() => submitReview("selected")}>Selected</Button>
              <Button variant="ghost" onClick={() => submitReview("hold")}>
                Hold
              </Button>
              <Button variant="ghost" onClick={() => submitReview("rejected")}>
                Reject
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
