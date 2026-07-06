import { Suspense } from "react";
import { LoginForm } from "./LoginForm";
import { FaceAvatar } from "@/components/FaceAvatar";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--cream-2)] px-6 py-12">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center -space-x-3">
          {["PS", "AD", "NR", "VS"].map((n) => (
            <FaceAvatar key={n} name={n} size="md" />
          ))}
        </div>
        <h1 className="font-serif text-3xl font-extrabold">Join your team</h1>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">
          Sign in to your evaluation workspace
        </p>
        <div className="mt-8 rounded-[32px] bg-white p-8 text-left shadow-[0_8px_40px_rgba(41,41,41,.08)]">
          <Suspense fallback={<p className="text-sm">Loading…</p>}>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
