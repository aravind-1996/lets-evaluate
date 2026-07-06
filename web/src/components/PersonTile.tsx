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

const stageColors = {
  s1: "bg-[var(--orange)]",
  s2: "bg-[var(--cyan)]",
  s3: "bg-[#7c6bcf]",
  s4: "bg-[var(--green)]",
};

export function PersonTile({
  name,
  subtitle,
  stageLabel,
  stageColor = "s2",
  className,
}: PersonTileProps) {
  return (
    <div
      className={cn(
        "w-40 shrink-0 snap-start rounded-3xl bg-white p-4 text-center shadow-[0_2px_16px_rgba(41,41,41,.05)] transition-transform hover:scale-[1.03]",
        className,
      )}
    >
      <FaceAvatar name={name} size="lg" className="mx-auto mb-3" />
      <strong className="block text-sm font-bold">{name}</strong>
      <span className="text-[11px] text-[var(--ink-faint)]">{subtitle}</span>
      {stageLabel && (
        <>
          <div
            className={cn(
              "mx-auto mt-2.5 size-2 rounded-full",
              stageColors[stageColor],
            )}
          />
          <Pill variant="neutral" className="mt-2 text-[10px]">
            {stageLabel}
          </Pill>
        </>
      )}
    </div>
  );
}
