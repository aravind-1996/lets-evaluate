"use client";

type ChatMessage = {
  role: "ai" | "you";
  text: string;
  children?: React.ReactNode;
};

export function EvalChat({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="space-y-4">
      {messages.map((m, i) => (
        <div
          key={i}
          className={`flex gap-3 ${m.role === "you" ? "flex-row-reverse" : ""}`}
        >
          <div
            className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              m.role === "ai"
                ? "rounded-bl-md bg-white shadow-sm"
                : "rounded-br-md bg-[var(--cyan)] text-white"
            }`}
          >
            {m.text}
            {m.children}
          </div>
        </div>
      ))}
    </div>
  );
}
