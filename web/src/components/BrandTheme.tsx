import { brandToCssVars, getBrand } from "@/lib/brand";

/** Injects brand color tokens from .env — overrides defaults in tokens.css */
export function BrandTheme() {
  const css = brandToCssVars(getBrand());
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
