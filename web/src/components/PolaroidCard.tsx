import { FaceAvatar } from "./FaceAvatar";
import { Pill } from "./Pill";
import { cn } from "@/lib/utils";

const spineColors = {
  selected: "bg-[var(--green)]",
  hold: "bg-[var(--orange)]",
  rejected: "bg-red-500",
  neutral: "bg-[var(--cyan)]",
};

const pillVariant = {
  selected: "green" as const,
  hold: "orange" as const,
  rejected: "orange" as const,
  neutral: "cyan" as const,
};

type PolaroidCardProps = {
  name: string;
  meta: string;
  decision: "selected" | "hold" | "rejected" | "neutral";
  date: string;
  pdfHref?: string;
  className?: string;
};

export function PolaroidCard({
  name,
  meta,
  decision,
  date,
  pdfHref = "#",
  className,
}: PolaroidCardProps) {
  const label =
    decision === "selected"
      ? "Selected"
      : decision === "hold"
        ? "Hold"
        : decision === "rejected"
          ? "Rejected"
          : "Shortlist";

  return (
    <article
      className={cn(
        "case-card case-card-hover cursor-pointer overflow-hidden transition-transform",
        className,
      )}
    >
      <div className={cn("h-2", spineColors[decision])} />
      <div className="p-4">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="grid size-10 place-items-center rounded-lg border border-[var(--cream-2)] bg-[var(--cream-2)] text-xs font-extrabold">
            {name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()}
          </div>
          <Pill variant={pillVariant[decision]} className="text-[10px]">
            {label}
          </Pill>
        </div>
        <h3 className="font-serif text-lg font-bold">{name}</h3>
        <p className="text-xs capitalize text-[var(--ink-faint)]">{meta}</p>
        <div className="mt-3 flex items-center justify-between border-t border-dashed border-[var(--cream-2)] pt-3 text-[10px] font-medium text-[var(--ink-faint)]">
          <span>{date}</span>
          <a
            href={pdfHref}
            className="font-bold text-[var(--cyan-d)] no-underline hover:underline"
          >
            PDF ↓
          </a>
        </div>
      </div>
    </article>
  );
}
