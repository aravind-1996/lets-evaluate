import { Pill } from "@/components/Pill";

const steps = [
  { label: "Setup", num: "✓", state: "done" as const },
  { label: "Analyse", num: "2", state: "on" as const },
  { label: "Questions", num: "3", state: "idle" as const },
  { label: "Verdict", num: "4", state: "idle" as const },
];

export function DossierPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      <div
        className="absolute inset-x-4 -top-4 bottom-4 rounded-2xl border border-[var(--cream-2)] bg-white/40 shadow-sm"
        aria-hidden
      />
      <div
        className="absolute inset-x-2 -top-2 bottom-2 rounded-2xl border border-[var(--cream-2)] bg-white/70 shadow-md"
        aria-hidden
      />
      <article className="land-dossier-float relative z-10 rounded-2xl border border-[var(--cream-2)] bg-white p-6 shadow-[0_8px_32px_rgba(41,41,41,.08)]">
        <span className="absolute -top-3 left-6 rounded-full bg-[var(--cyan-soft)] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--cyan-d)]">
          Active case
        </span>

        <header className="mb-5 flex items-start justify-between gap-3 border-b border-dashed border-[var(--cream-2)] pb-4 pt-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[var(--ink-faint)]">
              Case #2026-0047
            </p>
            <h3 className="font-serif mt-1 text-2xl font-bold">Arjun Mehta</h3>
            <p className="mt-0.5 text-[13px] text-[var(--ink-soft)]">
              Senior React Developer · Platform Eng
            </p>
          </div>
          <Pill variant="green">Proceed</Pill>
        </header>

        <div className="mb-5 grid grid-cols-4 gap-2">
          {steps.map((step) => (
            <div
              key={step.label}
              className={[
                "rounded-xl border px-1 py-2.5 text-center text-[9px] font-bold uppercase tracking-wide",
                step.state === "done" &&
                  "border-[var(--green)] bg-[var(--green-soft)] text-[var(--green)]",
                step.state === "on" &&
                  "border-[var(--cyan)] bg-[var(--cyan-soft)] text-[var(--cyan-d)]",
                step.state === "idle" &&
                  "border-[var(--cream-2)] text-[var(--ink-faint)]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className="font-serif block text-lg leading-none">{step.num}</span>
              {step.label}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="font-serif grid size-[72px] shrink-0 place-items-center rounded-xl border border-[var(--cream-2)] bg-[var(--green-soft)] text-2xl text-[var(--green)] shadow-sm">
            82%
          </div>
          <div className="text-xs leading-relaxed text-[var(--ink-soft)]">
            <strong className="mb-1 block text-[13px] text-[var(--ink)]">
              Tech match score
            </strong>
            React &amp; TypeScript: strong alignment.
            <br />
            GraphQL: gap — probe in interview.
            <br />
            <span className="font-semibold text-[var(--cyan-d)]">
              3 questions generated
            </span>
          </div>
        </div>
      </article>
    </div>
  );
}
