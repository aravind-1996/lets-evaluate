import { cn } from "@/lib/utils";

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="case-label mb-2 block">
      {children}
    </label>
  );
}

export function FieldInput({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn("case-input", className)} {...props} />;
}

export function FieldTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn("case-input min-h-[80px] resize-y", className)} {...props} />;
}

export function FieldSelect({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn("case-input", className)} {...props}>
      {children}
    </select>
  );
}
