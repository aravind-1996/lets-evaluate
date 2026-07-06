import { FaceAvatar } from "./FaceAvatar";
import { Pill } from "./Pill";
import Link from "next/link";

type PolaroidCardProps = {
  name: string;
  meta: string;
  decision: "selected" | "hold" | "rejected" | "neutral";
  date: string;
  pdfHref?: string;
};

const photoStyles = {
  selected:
    "bg-gradient-to-br from-[var(--green-soft)] to-[#c5e8a8] text-[var(--green)]",
  hold: "bg-gradient-to-br from-[var(--orange-soft)] to-[#f5d4b0] text-[var(--orange)]",
  rejected: "bg-gradient-to-br from-[#fde8e8] to-[#f5b8b8] text-[#c53030]",
  neutral:
    "bg-gradient-to-br from-[var(--cyan-soft)] to-[#b8e4f5] text-[var(--cyan-d)]",
};

const pillVariant = {
  selected: "green" as const,
  hold: "orange" as const,
  rejected: "orange" as const,
  neutral: "cyan" as const,
};

export function PolaroidCard({
  name,
  meta,
  decision,
  date,
  pdfHref = "#",
}: PolaroidCardProps) {
  const label =
    decision === "selected"
      ? "Selected"
      : decision === "hold"
        ? "Hold"
        : decision === "rejected"
          ? "Passed"
          : "Shortlisted";

  return (
    <article className="cursor-pointer bg-white p-3.5 pb-5 shadow-[0_4px_20px_rgba(41,41,41,.08)] transition-transform hover:scale-[1.04] even:rotate-[1.5deg] odd:-rotate-2">
      <div
        className={`mb-3.5 flex aspect-square items-center justify-center rounded font-serif text-5xl font-extrabold ${photoStyles[decision]}`}
      >
        <FaceAvatar name={name} size="xl" className="ring-0" />
      </div>
      <strong className="block text-sm font-bold">{name}</strong>
      <span className="text-[11px] leading-snug text-[var(--ink-faint)] whitespace-pre-line">
        {meta}
      </span>
      <div className="mt-2.5 flex items-center justify-between border-t border-[var(--cream-2)] pt-2.5">
        <Pill variant={pillVariant[decision]} className="text-[10px] px-2.5 py-1">
          {label}
        </Pill>
        <Link
          href={pdfHref}
          className="text-[11px] font-bold text-[var(--cyan-d)] hover:underline"
        >
          PDF ↓
        </Link>
      </div>
      <span className="mt-1 block text-[10px] font-semibold text-[var(--ink-faint)]">
        {date}
      </span>
    </article>
  );
}
