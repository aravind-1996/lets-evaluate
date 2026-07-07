import OpenAI from "openai";

const MAX_RESUME = 4000;
const MAX_ROLE = 2000;
const MAX_RESUME_Q = 3000;
const MAX_NOTES = 2000;

/** Default for questions / notes — fast and cheap */
function defaultModel() {
  return process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";
}

/**
 * Resume analysis — always a full (non-mini) model. Deliberately does NOT fall
 * back to OPENAI_MODEL so the main analysis never silently runs on gpt-4o-mini.
 * Override only with the dedicated OPENAI_ANALYSIS_MODEL env var.
 */
export const ANALYSIS_MODEL =
  process.env.OPENAI_ANALYSIS_MODEL?.trim() || "gpt-4o";

function analysisModel() {
  return ANALYSIS_MODEL;
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

export type CareerEntry = {
  company: string;
  title: string;
  start: string;
  end: string;
  duration: string;
  is_current?: boolean;
};

export type TechComparisonEntry = {
  technology: string;
  /** "Matched" | "Unmatched" | "Clarification" */
  status: string;
};

export type TechExperienceEntry = {
  technology: string;
  first_year: string;
  /** A year or "Present" when still in use */
  last_year: string;
  total_years: string;
};

export type Clarification = {
  technology: string;
  reason: string;
};

export type ProjectSuggestion = {
  project: string;
  reason: string;
};

export type Suitability = {
  /** "Suitable" | "Partially suitable" | "Not suitable" | "" */
  verdict: string;
  description: string;
};

export type ResumeMetrics = {
  tech_match_score: number;
  experience_level: string;
  matched_technologies: string[];
  missing_technologies: string[];
  tech_comparison: TechComparisonEntry[];
  tech_experience: TechExperienceEntry[];
  clarifications: Clarification[];
  domain_expertise: string[];
  strengths: string[];
  concerns: string[];
  recommendation: string;
  summary: string;
  certifications: string[];
  career_history: CareerEntry[];
  total_experience_mentioned: string;
  total_experience_calculated: string;
  is_currently_employed: boolean;
  current_employer: string;
  current_role: string;
  current_tenure: string;
  suitability: Suitability;
  project_suggestions: ProjectSuggestion[];
};

export type AnalyzeOptions = {
  roleName?: string;
  projectName?: string;
  otherProjects?: { name: string; techStack: string[] }[];
};

export async function analyzeResume(
  resumeText: string,
  projectTechStack: string[],
  roleRequirements: string,
  opts: AnalyzeOptions = {},
): Promise<ResumeMetrics> {
  const openai = client();
  if (!openai) {
    return emptyMetrics(projectTechStack, "OpenAI API key not configured");
  }

  const roleName = opts.roleName?.trim() || "the role";
  const projectName = opts.projectName?.trim() || "the project";
  const otherProjectsBlock =
    opts.otherProjects && opts.otherProjects.length
      ? opts.otherProjects
          .map((p) => `- ${p.name}: ${p.techStack.join(", ") || "n/a"}`)
          .join("\n")
      : "None provided";

  const prompt = `You are an expert technical recruiter performing a rigorous, evidence-based resume evaluation.

STRICT GROUNDING RULES — follow exactly to avoid hallucination:
1. Base EVERY statement only on facts explicitly present in the resume text below. Never invent employers, job titles, dates, degrees, certifications, or skills.
2. If a piece of information is not present, use an empty string "", an empty array [], or "Not specified" — never guess.
3. Only list a technology under matched_technologies if it is clearly evidenced in the resume. Otherwise it is missing.
4. Derive total_experience_calculated and per-technology years only from dated roles/skills in the resume; if dates are missing, return "Not specified".
5. Be deterministic and consistent: identical input must always yield the same evaluation. Do not add creative embellishment.

Role being evaluated: ${roleName} on project "${projectName}".

Resume:
${resumeText.slice(0, MAX_RESUME)}

Required Tech Stack: ${projectTechStack.join(", ")}

Role Requirements:
${roleRequirements.slice(0, MAX_ROLE)}

Other open projects (for cross-suggestions):
${otherProjectsBlock}

Return ONLY a valid JSON object (no markdown) with EXACTLY these keys:
- tech_match_score (number)
- experience_level (string)
- matched_technologies (string[])
- missing_technologies (string[])
- tech_comparison: array of { technology, status } covering ALL Required Tech Stack items. status is "Matched" when clearly evidenced, "Unmatched" when absent, or "Clarification" when the resume only mentions it generically/vaguely (e.g. a bare keyword list) without concrete real-world usage.
- tech_experience: array of { technology, first_year, last_year, total_years } for the candidate's most-used technologies, computed from dated experience. Use "Present" for last_year when still in use. Include the top technologies by usage. If dates are unavailable, use "Not specified".
- clarifications: array of { technology, reason } for every technology the candidate listed only generically and where real-world, hands-on depth must be confirmed. reason briefly states why clarification is needed.
- domain_expertise: string[] of business/industry domains explicitly evidenced (e.g. Banking, Healthcare). Empty if none.
- strengths (string[])
- concerns (string[])  // weaknesses / gaps from the resume
- recommendation: one of "Proceed", "Hold", "Reject", justified strictly by resume evidence.
- summary (string)
- certifications (string[])
- career_history: array of { company, title, start, end, duration, is_current } ordered most recent first.
- total_experience_mentioned (string)
- total_experience_calculated (string)
- is_currently_employed (boolean)
- current_employer (string)  // current or, if not employed, most recent employer
- current_role (string)      // role/title at that employer
- current_tenure (string)    // duration at that employer
- suitability: { verdict, description } where verdict is "Suitable", "Partially suitable" or "Not suitable" for ${roleName} on "${projectName}", and description explains why in 1-3 sentences grounded in the resume.
- project_suggestions: array of { project, reason } naming which of the "Other open projects" above better match this candidate's skills. Empty array if none are provided or none match.`;

  try {
    const res = await openai.chat.completions.create({
      model: analysisModel(),
      temperature: 0,
      seed: 7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are a meticulous technical recruiter. You never fabricate information and you produce deterministic, reproducible JSON evaluations grounded only in the provided resume.",
        },
        { role: "user", content: prompt },
      ],
    });
    const raw = res.choices[0]?.message?.content ?? "{}";
    const result = withDefaults(parseJson<Partial<ResumeMetrics>>(raw));
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
    result.tech_match_score = result.tech_comparison.length
      ? Math.round((matched / result.tech_comparison.length) * 100)
      : 0;
    return result;
  } catch (e) {
    return emptyMetrics(
      projectTechStack,
      `Analysis failed: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
}

/** Ensure every field exists so the UI never crashes on a partial model reply. */
function withDefaults(r: Partial<ResumeMetrics>): ResumeMetrics {
  return {
    tech_match_score: r.tech_match_score ?? 0,
    experience_level: r.experience_level ?? "",
    matched_technologies: r.matched_technologies ?? [],
    missing_technologies: r.missing_technologies ?? [],
    tech_comparison: r.tech_comparison ?? [],
    tech_experience: r.tech_experience ?? [],
    clarifications: r.clarifications ?? [],
    domain_expertise: r.domain_expertise ?? [],
    strengths: r.strengths ?? [],
    concerns: r.concerns ?? [],
    recommendation: r.recommendation ?? "Hold",
    summary: r.summary ?? "",
    certifications: r.certifications ?? [],
    career_history: r.career_history ?? [],
    total_experience_mentioned: r.total_experience_mentioned ?? "",
    total_experience_calculated: r.total_experience_calculated ?? "",
    is_currently_employed: r.is_currently_employed ?? false,
    current_employer: r.current_employer ?? "",
    current_role: r.current_role ?? "",
    current_tenure: r.current_tenure ?? "",
    suitability: r.suitability ?? { verdict: "", description: "" },
    project_suggestions: r.project_suggestions ?? [],
  };
}

function emptyMetrics(stack: string[], msg: string): ResumeMetrics {
  return withDefaults({
    concerns: [msg],
    summary: msg,
    recommendation: "Hold",
    missing_technologies: stack,
    tech_comparison: stack.map((t) => ({
      technology: t,
      status: "Unmatched",
    })),
  });
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
