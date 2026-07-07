import { cn } from "@/lib/utils";

export function CabinetPage({
  title,
  subtitle,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <div className={cn("flex min-h-full flex-1 flex-col", className)}>
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--cream-2)] bg-white px-6 py-5 md:px-7">
        <div>
          <h1 className="font-serif text-2xl font-bold">{title}</h1>
          {subtitle && (
            <p className="mt-0.5 text-[13px] text-[var(--ink-faint)]">{subtitle}</p>
          )}
        </div>
        {actions}
      </header>
      <div className={cn("flex-1 bg-[var(--cream)] p-6 md:p-7", bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

export function CaseCard({
  children,
  className,
  hover = false,
}: {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div className={cn("case-card", hover && "case-card-hover", className)}>{children}</div>
  );
}

export function CasePanel({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("case-card overflow-hidden", className)}>
      <div className="case-panel-head">{title}</div>
      <div className="p-0">{children}</div>
    </section>
  );
}

export function StatBlock({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: React.ReactNode;
  icon?: string;
  className?: string;
}) {
  return (
    <div className={cn("case-card relative overflow-hidden p-5", className)} data-icon={icon}>
      <div className="case-label">{label}</div>
      <div className="font-serif mt-1 text-[2.5rem] leading-none">{value}</div>
      {icon && (
        <span
          className="pointer-events-none absolute bottom-2 right-3 text-[2rem] opacity-[0.08]"
          aria-hidden
        >
          {icon}
        </span>
      )}
    </div>
  );
}
