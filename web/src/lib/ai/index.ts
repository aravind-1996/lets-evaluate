import OpenAI from "openai";

const MAX_RESUME = 4000;
const MAX_ROLE = 2000;
const MAX_RESUME_Q = 3000;
const MAX_NOTES = 2000;

/** Default for questions / notes — fast and cheap */
function defaultModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/** Resume analysis — use a stronger model via OPENAI_ANALYSIS_MODEL */
function analysisModel() {
  return (
    process.env.OPENAI_ANALYSIS_MODEL?.trim() ||
    process.env.OPENAI_MODEL?.trim() ||
    "gpt-4o"
  );
}

function client() {
  const key = process.env.OPENAI_API_KEY;
  if (!key?.startsWith("sk-")) return null;
  return new OpenAI({ apiKey: key });
}

function parseJson<T>(text: string): T {
  let t = text.trim();
  if (t.startsWith("```")) {
    t = t
      .split("\n")
      .filter((l) => !l.trim().startsWith("```"))
      .join("\n")
      .trim();
  }
  return JSON.parse(t) as T;
}

const UNKNOWN = new Set(["unknown", "n/a", "-", "none", ""]);

function isUnknown(v: string) {
  return UNKNOWN.has((v || "").trim().toLowerCase());
}

export type ResumeMetrics = {
  tech_match_score: number;
  experience_level: string;
  matched_technologies: string[];
  missing_technologies: string[];
  tech_comparison: { technology: string; status: string }[];
  strengths: string[];
  concerns: string[];
  recommendation: string;
  summary: string;
  certifications: string[];
  career_history: Record<string, unknown>[];
  total_experience_mentioned: string;
  total_experience_calculated: string;
  is_currently_employed: boolean;
  current_employer: string;
};

export async function analyzeResume(
  resumeText: string,
  projectTechStack: string[],
  roleRequirements: string,
): Promise<ResumeMetrics> {
  const openai = client();
  if (!openai) {
    return emptyMetrics(projectTechStack, "OpenAI API key not configured");
  }

  const prompt = `You are an expert technical recruiter. Analyse the following resume against the job requirements.

Resume:
${resumeText.slice(0, MAX_RESUME)}

Required Tech Stack: ${projectTechStack.join(", ")}

Role Requirements:
${roleRequirements.slice(0, MAX_ROLE)}

Return ONLY a valid JSON object (no markdown) with keys: tech_match_score, experience_level, matched_technologies, missing_technologies, tech_comparison, strengths, concerns, recommendation, summary, certifications, career_history, total_experience_mentioned, total_experience_calculated, is_currently_employed, current_employer.

tech_comparison MUST include ALL technologies from Required Tech Stack with status Matched or Unmatched.`;

  try {
    const res = await openai.chat.completions.create({
      model: analysisModel(),
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const result = parseJson<ResumeMetrics>(raw);
    if (!result.tech_comparison?.length) {
      result.tech_comparison = projectTechStack.map((t) => ({
        technology: t,
        status: result.matched_technologies?.includes(t)
          ? "Matched"
          : "Unmatched",
      }));
    }
    const matched = result.tech_comparison.filter(
      (t) => t.status === "Matched",
    ).length;
    result.tech_match_score = Math.round(
      (matched / result.tech_comparison.length) * 100,
    );
    return result;
  } catch (e) {
    return emptyMetrics(
      projectTechStack,
      `Analysis failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

function emptyMetrics(stack: string[], msg: string): ResumeMetrics {
  return {
    tech_match_score: 0,
    experience_level: "Unknown",
    matched_technologies: [],
    missing_technologies: stack,
    tech_comparison: stack.map((t) => ({ technology: t, status: "Unmatched" })),
    strengths: [],
    concerns: [msg],
    recommendation: "Hold",
    summary: msg,
    certifications: [],
    career_history: [],
    total_experience_mentioned: "",
    total_experience_calculated: "",
    is_currently_employed: false,
    current_employer: "",
  };
}

export async function generateStandardQuestions(
  roleName: string,
  techStack: string[],
  numQuestions = 10,
  topic = "",
) {
  const openai = client();
  if (!openai)
    return [
      {
        question: "OpenAI API key not configured",
        category: "Technical",
        expected_answer_hints: "N/A",
      },
    ];

  const topicLine = topic.trim() ? `\nFocus on: ${topic.trim()}` : "";
  const prompt = `Generate ${numQuestions} interview questions for ${roleName}. Tech: ${techStack.join(", ")}${topicLine}. Return JSON array with question, category, expected_answer_hints.`;

  const res = await openai.chat.completions.create({
    model: defaultModel(),
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = res.choices[0]?.message?.content ?? "[]";
  const result = parseJson<unknown[]>(raw);
  return Array.isArray(result) ? result : [];
}

export async function generateResumeQuestions(
  resumeText: string,
  roleRequirements: string,
  numQuestions = 10,
) {
  const openai = client();
  if (!openai)
    return [
      {
        question: "OpenAI API key not configured",
        category: "Technical",
        expected_answer_hints: "N/A",
      },
    ];

  const prompt = `Based on resume excerpt and role requirements, generate ${numQuestions} targeted questions. Return JSON array.

Resume: ${resumeText.slice(0, MAX_RESUME_Q)}
Requirements: ${roleRequirements.slice(0, MAX_ROLE / 2)}`;

  const res = await openai.chat.completions.create({
    model: defaultModel(),
    temperature: 0.7,
    messages: [{ role: "user", content: prompt }],
  });
  const raw = res.choices[0]?.message?.content ?? "[]";
  const result = parseJson<unknown[]>(raw);
  return Array.isArray(result) ? result : [];
}

export async function refineEvaluationNotes(notes: string) {
  const openai = client();
  if (!openai || !notes.trim()) return notes;
  const res = await openai.chat.completions.create({
    model: defaultModel(),
    temperature: 0.5,
    messages: [
      {
        role: "user",
        content: `Refine these evaluation notes professionally. Return only refined text.\n\n${notes.slice(0, MAX_NOTES)}`,
      },
    ],
  });
  return res.choices[0]?.message?.content?.trim() ?? notes;
}

export { isUnknown };
