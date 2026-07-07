"use client";

import { FaceAvatar } from "./FaceAvatar";
import { cn } from "@/lib/utils";

type ChatMessage = {
  role: "ai" | "you";
  text: string;
  children?: React.ReactNode;
};

export function EvalChat({
  messages,
  className,
}: {
  messages: ChatMessage[];
  className?: string;
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.length === 0 && (
        <p className="text-sm italic text-[var(--ink-faint)]">
          AI findings will appear here after analysis…
        </p>
      )}
      {messages.map((m, i) => (
        <div
          key={i}
          className={cn("flex gap-3", m.role === "you" && "flex-row-reverse")}
        >
          {m.role === "ai" && (
            <div className="grid size-8 shrink-0 place-items-center rounded-lg border border-[var(--cream-2)] bg-[var(--cyan-soft)] text-xs font-bold text-[var(--cyan-d)]">
              AI
            </div>
          )}
          {m.role === "you" && <FaceAvatar name="You" size="sm" className="size-8 text-[10px]" />}
          <div
            className={cn(
              "max-w-[88%] rounded-xl px-4 py-3 text-sm leading-relaxed",
              m.role === "ai"
                ? "rounded-bl-sm border border-[var(--cream-2)] bg-white shadow-sm"
                : "rounded-br-sm bg-[var(--cyan)] text-white",
            )}
          >
            {m.text}
            {m.children}
          </div>
        </div>
      ))}
    </div>
  );
}
