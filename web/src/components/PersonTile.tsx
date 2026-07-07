import { FaceAvatar } from "./FaceAvatar";
import { Pill } from "./Pill";
import { cn } from "@/lib/utils";

type PersonTileProps = {
  name: string;
  subtitle: string;
  stageLabel?: string;
  stageColor?: "s1" | "s2" | "s3" | "s4";
  href?: string;
  className?: string;
};

export function PersonTile({
  name,
  subtitle,
  stageLabel,
  className,
}: PersonTileProps) {
  return (
    <div
      className={cn(
        "case-card case-card-hover w-44 shrink-0 snap-start p-4 text-center",
        className,
      )}
    >
      <FaceAvatar name={name} size="lg" className="mx-auto mb-3" />
      <strong className="block text-sm font-bold">{name}</strong>
      <span className="text-[11px] text-[var(--ink-faint)]">{subtitle}</span>
      {stageLabel && (
        <Pill variant="neutral" className="mt-2 text-[10px]">
          {stageLabel}
        </Pill>
      )}
    </div>
  );
}
