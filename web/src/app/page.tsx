import Link from "next/link";
import { ButtonLink } from "@/components/Button";
import { FaceAvatar } from "@/components/FaceAvatar";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden px-6 pb-16 pt-12 text-center">
        <div
          className="pointer-events-none absolute left-1/2 top-[-200px] h-[500px] w-[500px] -translate-x-1/2 opacity-60"
          style={{
            background: "var(--cyan-soft)",
            borderRadius: "60% 40% 55% 45% / 45% 55% 45% 55%",
          }}
        />
        <p className="relative text-sm font-semibold text-[var(--cyan-d)]">
          KANINI · Let&apos;s Evaluate
        </p>
        <h1 className="font-serif relative mx-auto mt-4 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          Hiring is about <em className="text-[var(--cyan-d)] not-italic">people</em> — not
          spreadsheets
        </h1>
        <p className="relative mx-auto mt-4 max-w-lg text-[17px] leading-relaxed text-[var(--ink-soft)]">
          Every evaluation starts with a human story. AI helps your team see it clearly. You
          keep the final word.
        </p>
        <div className="relative mt-8 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/register">Start evaluating</ButtonLink>
          <ButtonLink href="/login" variant="ghost">
            Sign in
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-5 px-6 pb-20 md:grid-cols-3">
        {[
          {
            who: "TA / Recruiter",
            name: "Priya Sharma",
            quote:
              "I upload a resume and immediately see if this person fits our stack — without reading 4 pages first.",
          },
          {
            who: "Technical Interviewer",
            name: "Amit Desai",
            quote:
              "I walk into the interview knowing exactly where the gaps are. No more generic questions.",
          },
          {
            who: "The Candidate",
            name: "Arjun Mehta",
            quote:
              "My skills are matched against the actual role — not someone's gut feeling from a 30-second skim.",
          },
        ].map((p, i) => (
          <article
            key={p.who}
            className="rounded-3xl bg-white p-8 shadow-[0_4px_24px_rgba(41,41,41,.06)]"
            style={{
              marginTop: i === 1 ? 24 : i === 2 ? 48 : 0,
              borderRadius:
                i === 0
                  ? "28px 28px 28px 8px"
                  : i === 1
                    ? "28px 28px 8px 28px"
                    : "28px 8px 28px 28px",
            }}
          >
            <FaceAvatar name={p.name} size="xl" />
            <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-[var(--ink-faint)]">
              {p.who}
            </p>
            <h3 className="font-serif mt-2 text-xl font-bold">{`"${p.quote.slice(0, 30)}…"`}</h3>
            <p className="mt-2 text-sm italic leading-relaxed text-[var(--ink-soft)]">
              {p.quote}
            </p>
          </article>
        ))}
      </section>

      <section className="bg-[var(--navy)] px-6 py-14 text-white">
        <h2 className="font-serif text-center text-2xl font-bold">
          Their journey, your decision
        </h2>
        <div className="mx-auto mt-10 grid max-w-3xl gap-8 md:grid-cols-4">
          {[
            ["Resume arrives", "TA uploads, picks the role"],
            ["AI reads it", "Skills mapped to your stack"],
            ["Team discusses", "Questions + interview focus"],
            ["You decide", "Proceed, hold, or pass"],
          ].map(([title, sub], i) => (
            <div key={title} className="text-center">
              <div className="mx-auto mb-3 grid size-14 place-items-center rounded-full border-2 border-white/20 bg-white/10 text-lg font-bold">
                {i + 1}
              </div>
              <h4 className="text-sm font-bold">{title}</h4>
              <p className="mt-1 text-xs text-white/55">{sub}</p>
            </div>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-white/40">
          Built for <span className="font-bold text-[var(--cyan)]">KANINI</span> teams ·
          Intellect · Energy · Integrity
        </p>
      </section>

      <footer className="border-t border-[var(--cream-2)] py-5 text-center text-xs text-[var(--ink-faint)]">
        <Link href="/login">Sign in</Link>
        {" · "}
        © 2026 KANINI Software Solutions
      </footer>
    </main>
  );
}
