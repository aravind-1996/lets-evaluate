import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";

export type ReportQuestion = {
  category: string;
  question: string;
  code?: string;
  difficulty?: string;
  satisfaction?: string;
  notes?: string;
};

export type InterviewReportData = {
  candidateName: string;
  role: string;
  projectName?: string;
  round: string;
  interviewerName: string;
  decision: "yes" | "no" | string;
  justification: string;
  generatedAt: Date;
  techMatchScore?: number | null;
  aiRecommendation?: string;
  aiSummary?: string;
  strengths?: string[];
  concerns?: string[];
  questions: ReportQuestion[];
};

const PAGE = { w: 595.28, h: 841.89 }; // A4 portrait
const MARGIN = 48;
const CONTENT_W = PAGE.w - MARGIN * 2;

const INK = rgb(0.11, 0.13, 0.18);
const FAINT = rgb(0.42, 0.45, 0.5);
const CYAN = rgb(0.0, 0.55, 0.62);
const GREEN = rgb(0.15, 0.55, 0.3);
const ORANGE = rgb(0.8, 0.42, 0.13);
const RULE = rgb(0.85, 0.85, 0.82);

/** Simple top-down layout engine over pdf-lib with automatic page breaks. */
class Writer {
  doc!: PDFDocument;
  page!: PDFPage;
  font!: PDFFont;
  bold!: PDFFont;
  mono!: PDFFont;
  y = 0;

  async init() {
    this.doc = await PDFDocument.create();
    this.font = await this.doc.embedFont(StandardFonts.Helvetica);
    this.bold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.mono = await this.doc.embedFont(StandardFonts.Courier);
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage([PAGE.w, PAGE.h]);
    this.y = PAGE.h - MARGIN;
  }

  ensure(space: number) {
    if (this.y - space < MARGIN) this.newPage();
  }

  wrap(text: string, font: PDFFont, size: number, maxW: number): string[] {
    const lines: string[] = [];
    for (const raw of (text || "").split("\n")) {
      if (raw === "") {
        lines.push("");
        continue;
      }
      const words = raw.split(/\s+/);
      let line = "";
      for (const word of words) {
        // Hard-break words longer than the column.
        let w = word;
        while (font.widthOfTextAtSize(w, size) > maxW && w.length > 1) {
          let cut = w.length;
          while (
            cut > 1 &&
            font.widthOfTextAtSize(w.slice(0, cut), size) > maxW
          ) {
            cut--;
          }
          if (line) {
            lines.push(line);
            line = "";
          }
          lines.push(w.slice(0, cut));
          w = w.slice(cut);
        }
        const trial = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(trial, size) > maxW && line) {
          lines.push(line);
          line = w;
        } else {
          line = trial;
        }
      }
      lines.push(line);
    }
    return lines;
  }

  text(
    text: string,
    opts: {
      size?: number;
      font?: PDFFont;
      color?: ReturnType<typeof rgb>;
      indent?: number;
      gap?: number;
      lineGap?: number;
    } = {},
  ) {
    const size = opts.size ?? 10;
    const font = opts.font ?? this.font;
    const color = opts.color ?? INK;
    const indent = opts.indent ?? 0;
    const lineGap = opts.lineGap ?? 3;
    const maxW = CONTENT_W - indent;
    const lines = this.wrap(text, font, size, maxW);
    for (const line of lines) {
      this.ensure(size + lineGap);
      this.page.drawText(line, {
        x: MARGIN + indent,
        y: this.y - size,
        size,
        font,
        color,
      });
      this.y -= size + lineGap;
    }
    if (opts.gap) this.y -= opts.gap;
  }

  heading(label: string) {
    this.y -= 8;
    this.ensure(26);
    this.page.drawText(label.toUpperCase(), {
      x: MARGIN,
      y: this.y - 11,
      size: 11,
      font: this.bold,
      color: CYAN,
    });
    this.y -= 16;
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE.w - MARGIN, y: this.y },
      thickness: 0.75,
      color: RULE,
    });
    this.y -= 10;
  }

  keyVal(label: string, value: string) {
    this.ensure(14);
    this.page.drawText(`${label}: `, {
      x: MARGIN,
      y: this.y - 10,
      size: 10,
      font: this.bold,
      color: FAINT,
    });
    const labelW = this.bold.widthOfTextAtSize(`${label}: `, 10);
    const lines = this.wrap(value || "—", this.font, 10, CONTENT_W - labelW);
    lines.forEach((line, i) => {
      if (i > 0) this.ensure(13);
      this.page.drawText(line, {
        x: MARGIN + (i === 0 ? labelW : 0),
        y: this.y - 10,
        size: 10,
        font: this.font,
        color: INK,
      });
      this.y -= 13;
    });
  }

  bullets(items: string[], color = INK) {
    for (const item of items) {
      const lines = this.wrap(item, this.font, 10, CONTENT_W - 14);
      lines.forEach((line, i) => {
        this.ensure(13);
        if (i === 0) {
          this.page.drawText("•", {
            x: MARGIN + 2,
            y: this.y - 10,
            size: 10,
            font: this.bold,
            color,
          });
        }
        this.page.drawText(line, {
          x: MARGIN + 14,
          y: this.y - 10,
          size: 10,
          font: this.font,
          color: INK,
        });
        this.y -= 13;
      });
    }
  }

  codeBlock(code: string) {
    const size = 8.5;
    const lines = this.wrap(code, this.mono, size, CONTENT_W - 16);
    const blockH = lines.length * (size + 3) + 12;
    this.ensure(blockH);
    const top = this.y;
    this.page.drawRectangle({
      x: MARGIN,
      y: top - blockH,
      width: CONTENT_W,
      height: blockH,
      color: rgb(0.96, 0.96, 0.94),
      borderColor: RULE,
      borderWidth: 0.5,
    });
    this.y -= 8;
    for (const line of lines) {
      this.page.drawText(line, {
        x: MARGIN + 8,
        y: this.y - size,
        size,
        font: this.mono,
        color: INK,
      });
      this.y -= size + 3;
    }
    this.y -= 8;
  }
}

function satColor(sat?: string) {
  const s = (sat ?? "").toLowerCase();
  if (s.startsWith("satisf") && !s.startsWith("not")) return GREEN;
  if (s.startsWith("not")) return ORANGE;
  return FAINT;
}

export async function buildInterviewReportPdf(
  data: InterviewReportData,
): Promise<Buffer> {
  const w = new Writer();
  await w.init();

  // Title bar
  w.page.drawRectangle({
    x: 0,
    y: PAGE.h - 96,
    width: PAGE.w,
    height: 96,
    color: rgb(0.09, 0.13, 0.22),
  });
  w.page.drawText("Interview Evaluation Report", {
    x: MARGIN,
    y: PAGE.h - 46,
    size: 20,
    font: w.bold,
    color: rgb(1, 1, 1),
  });
  w.page.drawText(
    `${data.round} · ${data.generatedAt.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })}`,
    {
      x: MARGIN,
      y: PAGE.h - 68,
      size: 10,
      font: w.font,
      color: rgb(0.8, 0.85, 0.9),
    },
  );
  w.y = PAGE.h - 96 - 20;

  // Summary block
  w.heading("Candidate");
  w.keyVal("Name", data.candidateName);
  w.keyVal(
    "Role",
    data.projectName ? `${data.role} — ${data.projectName}` : data.role,
  );
  w.keyVal("Interviewer", data.interviewerName);
  w.keyVal("Round", data.round);
  const decisionText =
    data.decision === "yes"
      ? "Proceed to next round"
      : data.decision === "no"
        ? "Do not proceed"
        : String(data.decision || "—");
  w.keyVal("Decision", decisionText);

  // AI analysis snapshot
  if (
    data.techMatchScore != null ||
    data.aiRecommendation ||
    data.aiSummary ||
    (data.strengths && data.strengths.length) ||
    (data.concerns && data.concerns.length)
  ) {
    w.heading("AI analysis snapshot");
    if (data.techMatchScore != null) {
      w.keyVal("Tech match", `${data.techMatchScore}%`);
    }
    if (data.aiRecommendation) {
      w.keyVal("AI recommendation", data.aiRecommendation);
    }
    if (data.aiSummary) {
      w.text(data.aiSummary, { gap: 4, color: INK });
    }
    if (data.strengths && data.strengths.length) {
      w.text("Strengths", { font: w.bold, size: 10, gap: 2 });
      w.bullets(data.strengths, GREEN);
    }
    if (data.concerns && data.concerns.length) {
      w.text("Concerns / gaps", { font: w.bold, size: 10, gap: 2 });
      w.bullets(data.concerns, ORANGE);
    }
  }

  // Questions
  w.heading(`Questions & assessment (${data.questions.length})`);
  if (data.questions.length === 0) {
    w.text("No questions were recorded for this round.", { color: FAINT });
  }
  data.questions.forEach((q, i) => {
    w.ensure(40);
    w.text(`${i + 1}. ${q.question}`, { font: w.bold, size: 10.5, gap: 2 });
    const meta = [q.category, q.difficulty].filter(Boolean).join(" · ");
    if (meta) w.text(meta, { size: 8.5, color: FAINT, gap: 2 });
    if (q.code) w.codeBlock(q.code);
    const sat = q.satisfaction?.trim();
    if (sat) {
      w.ensure(14);
      w.page.drawText(`Assessment: ${sat}`, {
        x: MARGIN,
        y: w.y - 10,
        size: 9.5,
        font: w.bold,
        color: satColor(sat),
      });
      w.y -= 14;
    }
    if (q.notes?.trim()) {
      w.text(q.notes.trim(), { size: 9.5, color: INK, indent: 4 });
    }
    w.y -= 8;
  });

  // Justification
  w.heading("Interviewer justification");
  w.text(data.justification?.trim() || "—", { color: INK });

  // Footer note
  w.y -= 16;
  w.ensure(20);
  w.text(
    "Generated automatically by Let's Evaluate. AI outputs are advisory; the interviewer's assessment is authoritative.",
    { size: 8, color: FAINT },
  );

  const bytes = await w.doc.save();
  return Buffer.from(bytes);
}
