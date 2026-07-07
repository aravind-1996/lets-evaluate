import Link from "next/link";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

export function AuthFrame({
  children,
  activeTab,
}: {
  children: React.ReactNode;
  activeTab: "signin" | "register";
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream)] p-6">
      <div className="case-cabinet grid w-full max-w-[1000px] overflow-hidden md:grid-cols-[1fr_1.1fr]">
        <div className="relative hidden flex-col overflow-hidden bg-[var(--navy)] p-10 text-white md:flex">
          <div
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[30deg] text-[4rem] font-extrabold uppercase tracking-[0.2em] text-white/[0.04]"
            aria-hidden
          >
            Confidential
          </div>
          <Logo href="/" light className="relative z-10" />
          <h2 className="font-serif relative z-10 mt-10 text-[2.4rem] font-bold leading-tight">
            Your team&apos;s
            <em className="mt-1 block text-[var(--cyan)] not-italic">case room</em>
            starts here.
          </h2>
          <p className="relative z-10 mt-4 max-w-[280px] text-sm leading-relaxed text-white/70">
            Structured evaluations, shared question banks, and a complete audit trail for
            every hiring decision.
          </p>
          <div
            className="relative z-10 mt-auto grid size-[100px] place-items-center rounded-full border-[3px] border-[var(--cyan)] text-center text-[9px] font-bold uppercase leading-snug tracking-wide text-[var(--cyan)]"
            style={{ transform: "rotate(-12deg)" }}
          >
            Verified
            <br />
            TA
            <br />
            Workspace
          </div>
        </div>

        <div className="bg-white p-8 md:p-12">
          <div className="mb-8 flex border-b border-[var(--cream-2)]">
            <AuthTab href="/login" active={activeTab === "signin"}>
              Sign in
            </AuthTab>
            <AuthTab href="/register" active={activeTab === "register"}>
              Create account
            </AuthTab>
          </div>
          {children}
        </div>
      </div>
    </main>
  );
}

function AuthTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex-1 border-b-[3px] pb-3.5 text-center text-[13px] font-bold transition-colors",
        active
          ? "border-[var(--cyan)] text-[var(--ink)]"
          : "border-transparent text-[var(--ink-faint)] hover:text-[var(--ink-soft)]",
      )}
    >
      {children}
    </Link>
  );
}
