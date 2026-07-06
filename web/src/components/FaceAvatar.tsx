import { cn } from "@/lib/utils";

const colorMap = {
  c1: "bg-gradient-to-br from-[var(--cyan)] to-[var(--cyan-d)]",
  c2: "bg-gradient-to-br from-[var(--green)] to-[#4a8a1f]",
  c3: "bg-gradient-to-br from-[var(--orange)] to-[#c9651a]",
  c4: "bg-gradient-to-br from-[#7c6bcf] to-[#5a4db0]",
  c5: "bg-gradient-to-br from-[#e05a7a] to-[#c43d5e]",
} as const;

const sizeMap = {
  sm: "size-8 text-[11px]",
  md: "size-11 text-sm",
  lg: "size-14 text-[17px]",
  xl: "size-[88px] text-[28px]",
} as const;

export type FaceColor = keyof typeof colorMap;
export type FaceSize = keyof typeof sizeMap;

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function colorFromString(s: string): FaceColor {
  const colors: FaceColor[] = ["c1", "c2", "c3", "c4", "c5"];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i)) % colors.length;
  return colors[h];
}

type FaceAvatarProps = {
  name: string;
  size?: FaceSize;
  color?: FaceColor;
  className?: string;
};

export function FaceAvatar({
  name,
  size = "md",
  color,
  className,
}: FaceAvatarProps) {
  const c = color ?? colorFromString(name);
  return (
    <div
      className={cn(
        "relative grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-white",
        sizeMap[size],
        colorMap[c],
        className,
      )}
      aria-hidden
    >
      {initialsFromName(name)}
    </div>
  );
}
