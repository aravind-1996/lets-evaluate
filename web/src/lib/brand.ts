/**
 * White-label brand configuration — set once per deployment via .env
 * See web/.env.example for all available variables.
 */

const DEFAULT_COLORS = {
  primary: "#23b0e6",
  primaryDark: "#1c8db8",
  primarySoft: "#e3f4fb",
  accent: "#61a229",
  accentSoft: "#e8f3dc",
  warning: "#e87722",
  warningSoft: "#fce8d6",
  cream: "#fdf8f3",
  cream2: "#f5efe8",
  ink: "#292929",
  inkSoft: "#5c5c5c",
  inkFaint: "#9a9a9a",
  navy: "#1a2b3c",
  white: "#ffffff",
} as const;

function readHex(envKey: string, fallback: string): string {
  const value = process.env[envKey]?.trim();
  if (value && /^#[0-9a-fA-F]{3,8}$/.test(value)) return value;
  return fallback;
}

function mixWithWhite(hex: string, whiteRatio = 0.88): string {
  const normalized = hex.replace("#", "");
  const full =
    normalized.length === 3
      ? normalized
          .split("")
          .map((c) => c + c)
          .join("")
      : normalized.slice(0, 6);
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  const mix = (channel: number) =>
    Math.round(channel * (1 - whiteRatio) + 255 * whiteRatio);
  const toHex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
}

export type BrandColors = {
  primary: string;
  primaryDark: string;
  primarySoft: string;
  accent: string;
  accentSoft: string;
  warning: string;
  warningSoft: string;
  cream: string;
  cream2: string;
  ink: string;
  inkSoft: string;
  inkFaint: string;
  navy: string;
  white: string;
};

export type BrandConfig = {
  orgName: string;
  orgSlug: string;
  appTitle: string;
  appTitleAccent: string;
  tagline: string;
  description: string;
  copyright: string;
  logoUrl: string | undefined;
  faviconUrl: string | undefined;
  emailDomain: string;
  emailPlaceholder: string;
  appUrl: string;
  colors: BrandColors;
};

function resolveColors(): BrandColors {
  const primary = readHex("NEXT_PUBLIC_BRAND_PRIMARY", DEFAULT_COLORS.primary);
  const primaryDark = readHex(
    "NEXT_PUBLIC_BRAND_PRIMARY_DARK",
    DEFAULT_COLORS.primaryDark,
  );
  const accent = readHex("NEXT_PUBLIC_BRAND_ACCENT", DEFAULT_COLORS.accent);
  const warning = readHex("NEXT_PUBLIC_BRAND_WARNING", DEFAULT_COLORS.warning);

  return {
    primary,
    primaryDark,
    primarySoft: readHex(
      "NEXT_PUBLIC_BRAND_PRIMARY_SOFT",
      mixWithWhite(primary),
    ),
    accent,
    accentSoft: readHex(
      "NEXT_PUBLIC_BRAND_ACCENT_SOFT",
      mixWithWhite(accent),
    ),
    warning,
    warningSoft: readHex(
      "NEXT_PUBLIC_BRAND_WARNING_SOFT",
      mixWithWhite(warning),
    ),
    cream: readHex("NEXT_PUBLIC_BRAND_CREAM", DEFAULT_COLORS.cream),
    cream2: readHex("NEXT_PUBLIC_BRAND_CREAM_2", DEFAULT_COLORS.cream2),
    ink: readHex("NEXT_PUBLIC_BRAND_INK", DEFAULT_COLORS.ink),
    inkSoft: readHex("NEXT_PUBLIC_BRAND_INK_SOFT", DEFAULT_COLORS.inkSoft),
    inkFaint: readHex("NEXT_PUBLIC_BRAND_INK_FAINT", DEFAULT_COLORS.inkFaint),
    navy: readHex("NEXT_PUBLIC_BRAND_NAVY", DEFAULT_COLORS.navy),
    white: readHex("NEXT_PUBLIC_BRAND_WHITE", DEFAULT_COLORS.white),
  };
}

/** Server-safe brand config — reads all env vars including non-public ones. */
export function getBrand(): BrandConfig {
  const orgName =
    process.env.ORG_NAME ??
    process.env.NEXT_PUBLIC_ORG_NAME ??
    "KANINI";
  const orgSlug = process.env.ORG_SLUG ?? "kanini";
  const appTitle =
    process.env.NEXT_PUBLIC_APP_TITLE ?? "Let's Evaluate";
  const appTitleAccent =
    process.env.NEXT_PUBLIC_APP_TITLE_ACCENT ?? "Evaluate";
  const tagline =
    process.env.NEXT_PUBLIC_BRAND_TAGLINE ??
    "Intellect · Energy · Integrity";
  const description =
    process.env.NEXT_PUBLIC_APP_DESCRIPTION ??
    "AI-assisted technical hiring. People first.";
  const year = new Date().getFullYear();
  const copyright =
    process.env.NEXT_PUBLIC_BRAND_COPYRIGHT ??
    `© ${year} ${orgName}`;
  const emailDomain =
    process.env.ALLOWED_EMAIL_DOMAIN ??
    process.env.NEXT_PUBLIC_EMAIL_DOMAIN ??
    `${orgSlug}.com`;

  return {
    orgName,
    orgSlug,
    appTitle,
    appTitleAccent,
    tagline,
    description,
    copyright,
    logoUrl: process.env.NEXT_PUBLIC_BRAND_LOGO_URL?.trim() || undefined,
    faviconUrl: process.env.NEXT_PUBLIC_BRAND_FAVICON_URL?.trim() || undefined,
    emailDomain,
    emailPlaceholder: `you@${emailDomain}`,
    appUrl:
      process.env.AUTH_URL ??
      process.env.NEXT_PUBLIC_APP_URL ??
      "",
    colors: resolveColors(),
  };
}

/** CSS custom properties injected at runtime to override tokens.css defaults. */
export function brandToCssVars(brand: BrandConfig): string {
  const { colors: c } = brand;
  return `:root {
  --cyan: ${c.primary};
  --cyan-d: ${c.primaryDark};
  --cyan-soft: ${c.primarySoft};
  --green: ${c.accent};
  --green-soft: ${c.accentSoft};
  --orange: ${c.warning};
  --orange-soft: ${c.warningSoft};
  --cream: ${c.cream};
  --cream-2: ${c.cream2};
  --ink: ${c.ink};
  --ink-soft: ${c.inkSoft};
  --ink-faint: ${c.inkFaint};
  --white: ${c.white};
  --navy: ${c.navy};
}`;
}
